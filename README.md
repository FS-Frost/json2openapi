# json2openapi

![main](https://github.com/FS-Frost/json2openapi/actions/workflows/main.yml/badge.svg)

**https://fs-frost.github.io/json2openapi/**

Paste a JSON sample, get an **OpenAPI 3.1** schema (YAML or JSON), **TypeScript** interfaces or a **Zod 4** schema.
Everything runs in your browser: nothing is uploaded, and it works offline once installed.

## Features

- **Accurate inference**
  - `integer` vs `number`.
  - Nullable fields as `type: [string, "null"]`.
  - Every item of an array is merged: union of keys, and a key is `required` only if every item has it.
  - Mixed types become a type array or `anyOf`.
  - Empty objects and arrays and root arrays are supported.
- **Outputs**
  - Bare schema, `components/schemas` with `$ref`, or a full OpenAPI document. The document has a configurable title,
    version, method, path, status, and whether the sample is the request or the response body.
  - TypeScript interfaces, with optional `?` and `| null`.
  - Zod 4 code, with `.optional()`, `.nullable()` and `z.int()`.
  - A collapsible tree view of the inferred schema.
- **Input**: type or paste, open or drop a `.json` file, paste from the clipboard, or load the example.
  Parse errors show the line and column and are marked in the editor.
- **Share links**: the input and options are compressed into the URL hash. No server is involved.
- **History** of recent conversions and an auto-saved draft, both stored in your browser only.
- **Interface**: light, dark or system theme. Resizable split view. Mobile layout. Installable PWA that notices
  new versions.
- **Keyboard** (press `?` in the app to see them):

  | Action | Keys |
  | --- | --- |
  | Format input | `Alt+Shift+F` |
  | Copy output | `Alt+Shift+C` |
  | Download output | `Ctrl/⌘+S` |
  | Copy share link | `Alt+Shift+S` |
  | Open history | `Alt+Shift+H` |
  | Switch output tab | `Alt+1…4` |

## Development

Requires [Bun](https://bun.sh) (CI uses 1.4.2).

```sh
bun install
bun run dev      # http://localhost:5000
bun test         # unit tests (inference, emitters, parser, share links, history, shortcuts)
bun run check    # svelte-check, must stay at 0 errors / 0 warnings
bun run build    # static site in build/ (BASE_PATH=/json2openapi to mimic GitHub Pages)
```

Stack: SvelteKit 3 (static SPA) · Svelte 5 runes · TypeScript 6 · Tailwind CSS v4 · Monaco (bundled, no CDN) · Vite 8.

## Deploy

Every push to `main` runs type check, tests and build, then publishes `build/` to the `gh-pages` branch
(`.github/workflows/main.yml`).
