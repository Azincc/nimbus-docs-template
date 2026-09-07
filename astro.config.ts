import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import nimbus, {
  defineConfig as defineNimbusConfig,
} from "@cloudflare/nimbus-docs";
import { tableScroll } from "@cloudflare/nimbus-docs/markdown";
import site from "./.generated/site.json";

const nimbusConfig = defineNimbusConfig({
  ...site.nimbus,
  // The template builds Pagefind through its Node API after Astro succeeds.
  // Nimbus's visible search component continues to use its Pagefind provider.
  search: { provider: "custom" },
  head: site.nimbus.head as import("@cloudflare/nimbus-docs/types").HeadElement[],
});

export default defineConfig({
  // nimbus:adapter
  output: "static",
  // Tailwind v4 via its Vite plugin (the integration Astro recommends for
  // Tailwind v4 — replaces the PostCSS plugin, which doesn't build under
  // Astro 7's Vite 8 bundler).
  vite: {
    plugins: [tailwindcss(), {
      name: 'nimbus-native-markdown',
      // Astro 7 bundles prerender dependencies. Native bindings must resolve
      // from their installed package, alongside the matching platform binary.
      configEnvironment(name) {
        if (name === 'prerender') return { build: { rolldownOptions: { external: ['satteri'] } } };
      },
    }],
  },
  // Hover-prefetch link targets so full-page navigations feel instant without
  // a client-side router.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  integrations: [
    nimbus(nimbusConfig, {
      sitemap: Boolean(site.publicSite),
      // Authoring rules are opt-in by design — your repo, your taste. The
      // two below are the load-bearing pair: frontmatter has to validate
      // against the content schema for the page to render properly, and
      // broken internal links are 404s for your readers. Add the others
      // (heading hierarchy, code-block language, style, etc.) when you're
      // ready to enforce them — see `nimbus-docs lint --help`.
      rules: {
        "nimbus/frontmatter-shape": "error",
        "nimbus/internal-link": "error",
      },
      // Wrap wide tables so they scroll instead of overflowing the page
      // (styled by `.nb-table-scroll` in src/styles/prose.css).
      markdown: {
        hastPlugins: [tableScroll()],
      },
    }),
  ],
});
