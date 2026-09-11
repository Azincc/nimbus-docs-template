---
title: Markdown display test
description: Rendered examples of common Markdown styles with short source snippets.
sidebar:
  label: Markdown display test
  order: 10
---

This page is a browsable Markdown style sample. Use it to inspect headings, text, lists, tables, code, and images. 🔎

## Heading levels

The page title above is already an H1, so the body starts with H2 headings.

### Third-level heading H3

#### Fourth-level heading H4

##### Fifth-level heading H5

###### Sixth-level heading H6

```md
# First-level heading (provided by title on this page)
## Second-level heading
### Third-level heading
#### Fourth-level heading
##### Fifth-level heading
###### Sixth-level heading
```

## Paragraphs and line breaks

This is an ordinary paragraph. You can write several sentences together, and the browser wraps them to fit the available width.

This is a second paragraph, separated from the previous one by a blank line in the source.

This is the first line with an explicit line break.\
This is the second line in the same paragraph.

```md
First paragraph.

First line of the second paragraph.\
Second line of the second paragraph.
```

## Text styles

Plain text, **bold**, *italic*, ***bold italic***, ~~strikethrough~~, and inline code: `pnpm build`.

```md
**bold** *italic* ***bold italic*** ~~strikethrough~~ `pnpm build`
```

## Lists

- First unordered item
- Second unordered item
  - Nested item: additional information
  - Nested item: **a key point**

1. Prepare the documents.
2. Preview the result.
   1. Check text and links.
   2. Check images and code.
3. Publish the update.

GFM task lists can show progress. These checkboxes are a static part of the document:

- [x] Write the page
- [x] Add examples
- [ ] Add more content as needed

```md
- [x] Complete
- [ ] To do
```

## Blockquotes and horizontal rules

> This is a blockquote with **emphasized text**.
>
> > This nested blockquote demonstrates another level of detail.

The rule below separates content. Write `---` on its own line, with blank lines before and after it.

---

Ordinary text can continue after a horizontal rule. ✨

## Table alignment

| Left: style | Center: status | Right: count |
| :--- | :---: | ---: |
| **Bold text** | Complete ✅ | 12 |
| *Italic text* | In progress | 3 |
| `inline code` | Pending | 128 |

The row below the header uses `:---`, `:---:`, and `---:` for left, center, and right alignment respectively.

## Code blocks in different languages

JavaScript:

```js
const title = "Nimbus Docs Template";
function greet(name) {
  return `Hello, ${name}!`;
}
console.log(greet(title));
```

JSON:

```json
{
  "schemaVersion": 1,
  "title": "Markdown display test",
  "locale": "en"
}
```

Shell (displayed as text; these commands are not executed):

```sh
pnpm install --frozen-lockfile
pnpm build
```

## Links and images

- Relative site link: [Quick start](../getting-started.md).
- Same-page anchor: [Jump to text styles](#text-styles).
- External link: [Project repository on GitHub](https://github.com/Azincc/nimbus-docs-template.git).

![Official Nimbus logo as a local image example](../assets/nimbus-mark.svg)

```md
[Quick start](../getting-started.md)
[Jump to text styles](#text-styles)
![Local image](../assets/nimbus-mark.svg)
```

## Escaped characters

\*These asterisks stay visible\*, \[these square brackets stay visible\], and \# can appear as an ordinary character.

```md
\*Keep the asterisks\* \[Keep the brackets\] \# A plain hash character
```
