# CLAUDE.md

JSON → OpenAPI 3.1 schema converter (also TypeScript interfaces and Zod 4 code). **Static site (GitHub Pages)**, no
backend: SvelteKit 3 SPA (`adapter-static`, `ssr = false`) + Svelte 5 runes + TS 6 + Tailwind v4 + Monaco 0.57
(bundled locally, no CDN). Tooling and tests run on **Bun**. UI text in English. Stack and patterns mirror
`~/repos/sensei` (toasts, theme, PWA/update notice are ports of it).

## Commands

- `bun install`
- `bun run dev`: Vite dev server on port 5000 (`PORT` overrides).
- `bun test`: tests in `tests/`. They cover pure logic only: inference, emitters, parser, share codec, history,
  shortcuts and version.
- `bun run check`: svelte-check. Keep it at 0 errors / 0 warnings.
- `bun run build`: static site in `build/`. Set `BASE_PATH=/json2openapi` to build for Pages. CI copies
  `404.html` → `index.html`.
- Local preview caveat: `bun run preview` caches the file index at startup. Restart it after each build.
- UI check from WSL: run Edge headless (`msedge.exe --headless=new --user-data-dir=<win path>
  --virtual-time-budget=6000 --screenshot=<win path> http://localhost:<port>/json2openapi/`).
  - `--blink-settings=preferredColorScheme=1` forces light mode.
  - `--enable-logging=stderr --v=0 | grep CONSOLE` shows console errors.
- Deploy: `.github/workflows/main.yml` runs on push to `main`: check, test, build, then push `build/` to `gh-pages`.
  Bun is pinned to 1.4.2.

## SvelteKit 3 specifics (differ from Kit 2 knowledge)

- No `svelte.config.js`: Kit options go in the `sveltekit({...})` plugin in `vite.config.ts`.
- Alias is `#lib/*` (package.json `imports`). **Imports need file extensions** (`#lib/infer/infer.ts`).
- Use `$app/state` (no stores) and `$app/env` (`version`).
- `$app/paths` has no `base`: use `#lib/client/base.ts` (`import.meta.env.BASE_URL`).
- `tsconfig.json`:
  - `types` must include `$app/types`.
  - `exclude` must list `src/service-worker.ts` **with its extension**, or Kit warns on every build.
- TypeScript is pinned to 6.x: TS 7 has no JS API, so svelte-check breaks.

## Architecture

- `src/lib/infer/`
  - `ir.ts`: the intermediate `SchemaNode`.
  - `infer.ts`: JSON → IR, plus `merge`.
  - `names.ts`: names objects for `$ref`, TS and Zod (`nameSchemas`, `dependencyOrder`, `pascalCase`).
  - Every emitter reads the IR, never the raw JSON.
- `src/lib/emit/`
  - `openapi.ts`: bare schema, `components` + `$ref`, or a full document.
  - `typescript.ts`
  - `zod.ts`: generates Zod 4 source text. `zod` is not a dependency.
  - `serialize.ts`: JSON / YAML via `yaml`.
- `src/lib/convert.ts`: one parsed value + options → all outputs, plus `downloadInfo`.
- `src/lib/options.ts`: `Options` + `normalizeOptions`. It is the only entry point for options read from storage or
  from share links.
- `src/lib/parse.ts`: `parseJson`, plus its own validator `locateError` for the line/column. Engines disagree, and
  Safari gives no position.
- `src/lib/share.ts`: `#s=` token = base64url(deflate-raw(JSON `{v, j, o}`)). Bump `FORMAT` only for incompatible
  changes.
- `src/lib/history.ts`, `src/lib/tree.ts`, `src/lib/shortcuts.ts`: pure logic.
- `src/lib/client/`: browser glue.
  - Rune state (`*.svelte.ts`): theme, toast, prefs, history.
  - `storage.ts`: never-throwing localStorage.
  - `monaco.ts`: lazy Monaco setup.
  - `pwa.ts`, `version.ts`.
- `src/lib/components/`:
  - Editor
  - Header
  - OptionsBar
  - SchemaTree
  - HistoryPanel
  - ShortcutsDialog
  - DropZone
  - Toaster
  - UpdateNotice
  - Icon (inline SVG, no icon font)
- `src/routes/+page.svelte`: the whole app.
  - Initial input: share hash → draft → example.
  - It debounces the input, keeps the last good output (dimmed) while the input is invalid, and holds the actions
    and keyboard handling.
- `src/service-worker.ts`:
  - Precaches the immutable files, the assets and Monaco's worker graph (crawled from the chunks).
  - Navigation is network-first.
  - The cache is named `json2openapi-<version>`.

## Inference rules (OpenAPI 3.1 only)

- `integer` vs `number`. There is no `float` type: that was a bug of the old converter.
- `null` → nullable via a type array (`type: ["string", "null"]`, null last). Only nulls → `type: "null"`.
- Empty object → `type: object` without properties (never named or extracted). Empty array → `items: {}`. Root
  arrays are supported.
- Arrays merge **all** their items:
  - The keys are the union of all keys.
  - `required` = keys present in every item.
  - integer + number → number.
  - Mixed primitives → a type array. One object or array + primitives → a type array with that schema's keywords.
  - Two structured variants, or a `$ref`, → `anyOf`.
- Names: PascalCase of the key, and array items get the `Item` suffix (`eagles` → `EaglesItem`). Clashes get a
  numeric suffix. With refs, a root that is not an object (an array, a union) gets its own component named
  `rootName`.

## Conventions and gotchas

- Persisted keys are prefixed `json2openapi.`: `prefs`, `history`, `draft`, `split`, `theme`, `version`.
  `updateTarget` is kept in sessionStorage.
- Theme: light/dark/system per device. The inline script in `app.html` sets `data-theme` before paint.
  - Colors are CSS vars in `app.css`, mapped to Tailwind with `@theme inline` (`bg-panel`, `text-fg-2`,
    `border-line`, …). Don't hardcode colors.
  - Monaco themes are built from those vars and normalized by `toMonacoHex`. The CSS minifier shortens
    `#ffffff` → `#fff`, and Monaco rejects anything but `#rrggbb[aa]`.
- Notifications are toasts (`toast.success|info|warn|error`). Never `alert()`. The only inline error is the
  editor's parse error.
- Shortcuts use `Alt+Shift+…` because `Ctrl+Shift+C` opens DevTools. They are matched by `event.code`.
- `as` casts need a comment justifying them (APTUS rule).
- Commits: conventional commits. The user commits and pushes to `main` (which deploys).
