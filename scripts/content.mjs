import path from "node:path";
import { copyFile, lstat, mkdir, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import { parseDocument, stringify as stringifyYaml } from "yaml";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";
import { visit } from "unist-util-visit";
import { toString } from "mdast-util-to-string";
import { slug } from "github-slugger";

// Nimbus 0.13 scans .md with its MDX parser before rendering plain Markdown.
// Preserve visible content using explicit links and escaped literal braces.
const markdown = unified().use(remarkParse).use(remarkGfm).use(remarkStringify, {
  resourceLink: true,
  unsafe: [{ character: "{" }, { character: "}" }],
});
const slash = (value) => value.split(path.sep).join("/");
const pageRoute = (id) => id === "index" ? "/" : `/${id.replace(/\/index$/, "")}`;
const external = (url) => /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(url);

function assertInside(root, filename) {
  const relative = path.relative(root, filename);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Local reference escapes the source repository: ${filename}`);
  }
  return relative;
}

function assertPublicPath(relative) {
  if (slash(relative).split("/").some((segment) => segment.startsWith("."))) {
    throw new Error(`Hidden files and directories cannot be published: ${slash(relative)}`);
  }
}

async function safeStat(root, filename) {
  const relative = assertInside(root, filename);
  assertPublicPath(relative);
  let current = root;
  let stat = await lstat(root);
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    try {
      stat = await lstat(current);
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") return null;
      throw error;
    }
    if (stat.isSymbolicLink()) {
      throw new Error(`Symbolic links cannot be published: ${slash(relative)}`);
    }
  }
  return stat;
}

function parseSource(text, source) {
  text = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  let data = {};
  if (/^---[ \t]*\n/.test(text)) {
    const match = text.match(/^---[ \t]*\n([\s\S]*?)\n(?:---|\.\.\.)[ \t]*(?:\n|$)/);
    if (!match) throw new Error(`Unclosed YAML frontmatter in ${source}`);
    const document = parseDocument(match[1]);
    if (document.errors.length) {
      throw new Error(`Invalid YAML frontmatter in ${source}: ${document.errors[0].message}`);
    }
    data = document.toJS({ maxAliasCount: 100 }) ?? {};
    if (typeof data !== "object" || Array.isArray(data)) {
      throw new Error(`Frontmatter must be a mapping in ${source}`);
    }
    text = text.slice(match[0].length);
  }
  return { data, tree: markdown.parse(text) };
}

function normalizedId(relative, data, source) {
  const pieces = slash(relative).replace(/\.md$/i, "").split("/");
  const isIndex = /^(?:readme|index)$/i.test(pieces.at(-1));
  if (isIndex) pieces[pieces.length - 1] = "index";
  const generated = pieces.map((piece) => slug(piece)).join("/");
  const id = data.slug === undefined ? generated : data.slug;
  if (typeof id !== "string" || !id || id.startsWith("/") || id.endsWith("/") ||
      id.split("/").some((piece) => !piece || piece.startsWith(".")) || /[\s?#%\\:\u0000-\u001f]/.test(id)) {
    throw new Error(`Invalid frontmatter slug or filename in ${source}; use a relative URL path without an extension`);
  }
  if (isIndex && id !== generated) {
    throw new Error(`Directory home ${source} must use slug ${generated}; remove its custom slug`);
  }
  return id;
}

function splitReference(url) {
  const boundary = url.search(/[?#]/);
  const rawPath = boundary < 0 ? url : url.slice(0, boundary);
  let pathname;
  try {
    pathname = decodeURIComponent(rawPath);
  } catch {
    throw new Error(`Invalid URL encoding in local reference: ${url}`);
  }
  if (/[\\\u0000-\u001f]/.test(pathname) || /^[a-z]:/i.test(pathname)) {
    throw new Error(`Invalid local reference: ${url}`);
  }
  return { pathname, suffix: boundary < 0 ? "" : url.slice(boundary) };
}

function decodeAttribute(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, (entity) => {
    const named = { "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">" };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const code = entity[2].toLowerCase() === "x" ? parseInt(entity.slice(3, -1), 16) : Number(entity.slice(2, -1));
    return code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  });
}

const escapeAttribute = (value) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

async function rewriteHtml(html, source, resolveLink, copyAsset) {
  // Work only inside actual tags, leaving prose, comments and fenced examples intact.
  const tags = [...html.matchAll(/<!--[\s\S]*?-->|<[a-z][\w:-]*(?:"[^"]*"|'[^']*'|[^'">])*>/gi)];
  for (const match of tags.reverse()) {
    if (match[0].startsWith("<!--")) {
      // Comments have no rendered content; JSX rejects their HTML syntax.
      html = html.slice(0, match.index) + html.slice(match.index + match[0].length);
      continue;
    }
    let tag = match[0];
    const attributes = [...tag.matchAll(/(\s)([\w:-]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s"'=<>`]+)/g)];
    for (const attribute of attributes.reverse()) {
      const name = attribute[2].toLowerCase();
      const raw = attribute[4];
      const value = decodeAttribute(raw.startsWith('"') || raw.startsWith("'") ? raw.slice(1, -1) : raw);
      let rewritten = value;
      if (name === "srcset" && !/^data:/i.test(value)) {
        rewritten = (await Promise.all(value.split(",").map(async (candidate) => {
          const [url, ...descriptor] = candidate.trim().split(/\s+/);
          return [await copyAsset(url, source), ...descriptor].join(" ");
        }))).join(", ");
      } else if (["src", "href", "poster", "xlink:href"].includes(name)) {
        rewritten = await (name === "href" || name === "xlink:href" ? resolveLink : copyAsset)(value, source);
      }
      tag = tag.slice(0, attribute.index) + `${attribute[1]}${attribute[2]}${attribute[3]}"${escapeAttribute(rewritten)}"` + tag.slice(attribute.index + attribute[0].length);
    }
    // XML-style void tags render identically in HTML and satisfy the scanner.
    if (/^<(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(?=[\s/>])/i.test(tag) && !/\/\s*>$/.test(tag)) {
      tag = tag.replace(/>$/, " />");
    }
    html = html.slice(0, match.index) + tag + html.slice(match.index + match[0].length);
  }
  return html.replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");
}

/**
 * Prepare plain Markdown from a complete checkout. Only referenced assets are
 * copied into assetsDir (normally public/_source). The caller owns cleaning the
 * generated directories between builds. Source files are never modified.
 */
export async function prepareContent({ root, docsPath = ".", outputDir, assetsDir }) {
  root = await realpath(root);
  const docsRoot = path.resolve(root, docsPath);
  const docsStat = await safeStat(root, docsRoot);
  if (!docsStat?.isDirectory()) throw new Error(`DOCS_PATH is not a directory: ${docsPath}`);
  const sources = [];
  async function scan(directory) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, "en"))) {
      if (entry.name.startsWith(".")) continue;
      const filename = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Symbolic links cannot be published: ${slash(path.relative(root, filename))}`);
      if (entry.isDirectory()) await scan(filename);
      else if (entry.isFile() && /\.md$/i.test(entry.name)) sources.push(filename);
    }
  }
  await scan(docsRoot);
  if (!sources.length) throw new Error(`No Markdown (.md) documents found in DOCS_PATH: ${docsPath}`);
  // The orchestrator can copy the generated assets directory even for text-only docs.
  await mkdir(assetsDir, { recursive: true });

  const pages = [];
  const sourcePages = new Map();
  const routePages = new Map();
  const directoryPages = new Map();
  for (const filename of sources) {
    const source = slash(path.relative(root, filename));
    const { data, tree } = parseSource(await readFile(filename, "utf8"), source);
    let firstHeading;
    visit(tree, "heading", (node) => { firstHeading ??= node; });
    if (data.title !== undefined && (typeof data.title !== "string" || !data.title.trim())) {
      throw new Error(`Frontmatter title must be a nonempty string in ${source}`);
    }
    const title = data.title ?? ((firstHeading && toString(firstHeading).trim()) || path.basename(filename, path.extname(filename)));
    const id = normalizedId(path.relative(docsRoot, filename), data, source);
    const route = pageRoute(id);
    if (routePages.has(route)) {
      throw new Error(`Duplicate document route ${route}: ${routePages.get(route).source} and ${source}`);
    }
    const page = { source, id, route, title, data: { ...data, title, slug: id } };
    pages.push(page);
    sourcePages.set(filename, { ...page, tree });
    routePages.set(route, page);
    if (/^(?:readme|index)\.md$/i.test(path.basename(filename))) directoryPages.set(path.dirname(filename), page);
  }

  const absoluteSource = (source) => {
    const filename = path.isAbsolute(source) ? path.resolve(source) : path.resolve(root, source);
    assertInside(root, filename);
    return filename;
  };
  const localTarget = (pathname, source) => pathname.startsWith("/")
    ? path.resolve(root, `.${pathname}`)
    : path.resolve(path.dirname(absoluteSource(source)), pathname);
  const copied = new Set();
  async function copyAsset(url, source) {
    if (!url || external(url) || url.startsWith("#") || url.startsWith("?")) return url;
    const { pathname, suffix } = splitReference(url);
    const filename = localTarget(pathname, source);
    const stat = await safeStat(root, filename);
    if (!stat?.isFile()) throw new Error(`Missing local asset "${url}" referenced from ${source}`);
    const relative = slash(path.relative(root, filename));
    if (!copied.has(relative)) {
      const destination = path.join(assetsDir, relative);
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(filename, destination);
      copied.add(relative);
    }
    return `/_source/${relative.split("/").map(encodeURIComponent).join("/")}${suffix}`;
  }
  async function resolveLink(url, source) {
    if (!url || external(url) || url.startsWith("#") || url.startsWith("?")) return url;
    const { pathname, suffix } = splitReference(url);
    if (pathname.startsWith("/") && routePages.has(pathname.replace(/\/$/, "") || "/")) {
      return `${pathname.replace(/\/$/, "") || "/"}${suffix}`;
    }
    const filename = localTarget(pathname, source);
    assertInside(root, filename);
    assertPublicPath(path.relative(root, filename));
    const page = sourcePages.get(filename) ?? directoryPages.get(filename) ??
      (!path.extname(filename) ? sourcePages.get(`${filename}.md`) : undefined);
    if (page) return `${page.route}${suffix}`;
    if (/\.mdx?$/i.test(pathname)) {
      throw new Error(`Markdown link "${url}" from ${source} is missing or outside DOCS_PATH; use an absolute GitHub URL for documents outside the published directory`);
    }
    return copyAsset(url, source);
  }

  for (const { tree, ...page } of sourcePages.values()) {
    if (typeof page.data.socialImage === "string") {
      page.data.socialImage = await copyAsset(page.data.socialImage, page.source);
    }
    const nodes = [];
    visit(tree, (node) => {
      if (["link", "image", "definition", "html"].includes(node.type)) nodes.push(node);
    });
    for (const node of nodes) {
      if (node.type === "html") node.value = await rewriteHtml(node.value, page.source, resolveLink, copyAsset);
      else node.url = await (node.type === "image" ? copyAsset : resolveLink)(node.url, page.source);
    }
    const firstH1 = tree.children.findIndex((node) => node.type === "heading" && node.depth === 1);
    if (firstH1 >= 0 && toString(tree.children[firstH1]).trim() === page.title.trim()) {
      // Nimbus renders the title itself. Keep the authored GitHub anchor alive.
      tree.children.splice(firstH1, 1, { type: "html", value: `<a id="${escapeAttribute(slug(page.title))}"></a>` });
    }
    const destination = path.join(outputDir, `${page.id}.md`);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, `---\n${stringifyYaml(page.data)}---\n\n${markdown.stringify(tree)}`, "utf8");
  }
  return { pages, resolveLink, copyAsset };
}
