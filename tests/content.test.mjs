import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import os from "node:os";
import { mkdtemp, mkdir, readFile, rm, writeFile, readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { prepareContent } from "../scripts/content.mjs";

async function fixture(t, files) {
  const temp = await mkdtemp(path.join(os.tmpdir(), "nimbus-content-"));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const options = { root: path.join(temp, "source"), docsPath: "docs", outputDir: path.join(temp, "generated"), assetsDir: path.join(temp, "public", "_source") };
  for (const [filename, content] of Object.entries(files)) {
    const target = path.join(options.root, filename);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  return options;
}

test("Template Markdown produces a real home, rewritten links, and cross-directory images", async (t) => {
  const options = await fixture(t, {
    "docs/README.md": '# 快速上手\n\n[配置](getting-started/configuration.md#推荐配置)\n\n[部署][deploy]\n\n[deploy]: getting-started/deployment.md\n\n![登录](../assets/screenshots/login.png)\n\n<img src="../assets/screenshots/login.png" width="420">\n\n```md\n[example](not-a-real-file.md)\n```\n',
    "docs/getting-started/configuration.md": "# 模板配置\n\n## 推荐配置\n\n[首页](../README.md#快速上手)\n",
    "docs/getting-started/deployment.md": "# 模板部署\n",
    "assets/screenshots/login.png": "image-fixture",
    "assets/unreferenced.png": "not-published",
  });
  const result = await prepareContent(options);
  assert.equal(result.pages.length, 3);
  assert.deepEqual(result.pages.find((page) => page.id === "index"), {
    source: "docs/README.md", id: "index", route: "/", title: "快速上手", data: { title: "快速上手", slug: "index" },
  });
  const home = await readFile(path.join(options.outputDir, "index.md"), "utf8");
  assert.match(home, /title: 快速上手/);
  assert.match(home, /<a id="快速上手"><\/a>/);
  assert.doesNotMatch(home, /^# 快速上手$/m);
  assert.match(home, /\(\/getting-started\/configuration#推荐配置\)/);
  assert.match(home, /\[deploy\]: \/getting-started\/deployment/);
  assert.match(home, /!\[登录\]\(\/_source\/assets\/screenshots\/login.png\)/);
  assert.match(home, /src="\/_source\/assets\/screenshots\/login.png"/);
  assert.match(home, /\[example\]\(not-a-real-file.md\)/);
  assert.equal(await readFile(path.join(options.assetsDir, "assets/screenshots/login.png"), "utf8"), "image-fixture");
  assert.deepEqual(await readdir(path.join(options.assetsDir, "assets")), ["screenshots"]);
  assert.match(await readFile(path.join(options.outputDir, "getting-started/configuration.md"), "utf8"), /\(\/#快速上手\)/);
  assert.match(await readFile(path.join(options.root, "docs/README.md"), "utf8"), /^# 快速上手/);
});

test("existing frontmatter, custom routes, directory homes, and referenced assets are preserved", async (t) => {
  const options = await fixture(t, {
    "docs/README.md": "# Home\n\n[Guide](Guide/)\n[Page](Guide/My%20Page.md?from=home#section)\n",
    "docs/Guide/index.md": "# Guide\n\n[Home](../)\n",
    "docs/Guide/My Page.md": "---\ntitle: Custom title\ndescription: Existing description\nsidebar:\n  order: 3\nslug: tutorials/custom\n---\n\n# Authored heading\n\n## Section\n",
    "brand/logo.svg": "<svg></svg>",
  });
  const result = await prepareContent(options);
  const page = result.pages.find((page) => page.id === "tutorials/custom");
  assert.equal(page.data.description, "Existing description");
  assert.deepEqual(page.data.sidebar, { order: 3 });
  const generated = await readFile(path.join(options.outputDir, "tutorials/custom.md"), "utf8");
  assert.equal((generated.match(/^---$/gm) ?? []).length, 2);
  assert.match(generated, /# Authored heading/);
  assert.equal(await result.resolveLink("Guide/", "docs/README.md"), "/guide");
  assert.equal(await result.resolveLink("Guide/My%20Page.md?from=home#section", "docs/README.md"), "/tutorials/custom?from=home#section");
  assert.equal(await result.copyAsset("../brand/logo.svg", "docs/README.md"), "/_source/brand/logo.svg");
  assert.equal(await result.resolveLink("https://example.com/file.md", "docs/README.md"), "https://example.com/file.md");
});

test("fresh page inventory follows document additions and deletions", async (t) => {
  const options = await fixture(t, { "docs/README.md": "# Home", "docs/old.md": "# Old" });
  assert.deepEqual((await prepareContent(options)).pages.map((page) => page.id).sort(), ["index", "old"]);
  await rm(path.join(options.root, "docs/old.md"));
  await writeFile(path.join(options.root, "docs/new.md"), "# New");
  // The build orchestrator replaces generated directories before every build.
  await rm(options.outputDir, { recursive: true, force: true });
  assert.deepEqual((await prepareContent(options)).pages.map((page) => page.id).sort(), ["index", "new"]);
  assert.deepEqual((await readdir(options.outputDir)).sort(), ["index.md", "new.md"]);
});

test("ambiguous home routes and missing or private local references fail before publication", async (t) => {
  const options = await fixture(t, { "docs/README.md": "# Home", "docs/index.md": "# Second home", ".git/config": "private" });
  await assert.rejects(prepareContent(options), /Duplicate document route/);
  await rm(path.join(options.root, "docs/index.md"));
  const { resolveLink, copyAsset } = await prepareContent(options);
  await assert.rejects(resolveLink("missing.md", "docs/README.md"), /missing or outside DOCS_PATH/);
  await assert.rejects(copyAsset("../.git/config", "docs/README.md"), /Hidden files/);
  await assert.rejects(copyAsset("../../secret.txt", "docs/README.md"), /escapes the source repository/);
  await assert.rejects(copyAsset("missing.png", "docs/README.md"), /Missing local asset/);
});


test("ordinary Markdown remains compatible with Nimbus's MDX-based link scanner", async (t) => {
  const options = await fixture(t, {
    "docs/README.md": '# Plain Markdown\n\n<https://example.com/docs>\n\nContact <hello@example.com>.\n\nLiteral {parameter} and {"key": "value"}.\n\n<!-- An invisible HTML comment -->\n\n<img src="../assets/image.png" width=420>\n\nUse <kbd>{key}</kbd><br>then continue.\n\n<details>\n<summary>Examples</summary>\n\nText with {braces}.\n\n</details>\n\n~~~js\nconst value = { untouched: true };\n~~~\n',
    "assets/image.png": "fixture",
  });
  await prepareContent(options);
  const generated = await readFile(path.join(options.outputDir, "index.md"), "utf8");
  assert.match(generated, /\[https:\/\/example.com\/docs\]\(https:\/\/example.com\/docs\)/);
  assert.match(generated, /width="420" \/>/);
  assert.match(generated, /const value = \{ untouched: true \};/);
  assert.doesNotMatch(generated, /invisible HTML comment/);
  // Exercise the pinned link scanner with ordinary Markdown syntax.
  const nimbusDist = path.resolve("node_modules/@cloudflare/nimbus-docs/dist");
  const normalizerFile = (await readdir(nimbusDist)).find((name) => /^authored-links-.+\.js$/.test(name));
  const { normalizeAuthoredLinks } = await import(pathToFileURL(path.join(nimbusDist, normalizerFile)).href);
  assert.equal(normalizeAuthoredLinks(generated, { base: "/", sourceId: "plain-markdown-fixture.md" }), generated);
});
