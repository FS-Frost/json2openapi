// Monaco bundled locally (no CDN, works offline). Loaded lazily by components/Editor.svelte.
// Only what the app uses: editor core + features, JSON language service (validation, folding, formatting),
// and Monarch highlighting for YAML and TypeScript (no TS language worker: outputs are read-only).
import * as monaco from 'monaco-editor/editor/editor.api';
import 'monaco-editor/features/register.all';
import { jsonDefaults } from 'monaco-editor/languages/features/json/register';
import 'monaco-editor/languages/definitions/yaml/register';
import 'monaco-editor/languages/definitions/typescript/register';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/language/json/json.worker?worker';

self.MonacoEnvironment = {
	getWorker: (_id: string, label: string) => (label === 'json' ? new JsonWorker() : new EditorWorker())
};

// The page reports parse errors itself (lib/parse.ts: same message in the status bar and the editor marker).
jsonDefaults.setDiagnosticsOptions({ validate: false });

export { monaco };
export type Monaco = typeof monaco;

/**
 * Any CSS color → `#rrggbb` / `#rrggbbaa`, the only forms Monaco accepts. The CSS minifier shortens tokens
 * (`#ffffff` → `#fff`), so values are normalized through a canvas instead of trusting app.css as written.
 */
let ctx: CanvasRenderingContext2D | null | undefined;
export function toMonacoHex(color: string): string {
	ctx ??= document.createElement('canvas').getContext('2d');
	if (!ctx) return '#000000';
	ctx.fillStyle = '#000000';
	ctx.fillStyle = color;
	const out = String(ctx.fillStyle); // '#rrggbb' when opaque, 'rgba(r, g, b, a)' otherwise
	const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(out);
	if (!m) return out;
	const hex = (n: number) => n.toString(16).padStart(2, '0');
	const alpha = m[4] === undefined ? '' : hex(Math.round(Number(m[4]) * 255));
	return `#${hex(+m[1])}${hex(+m[2])}${hex(+m[3])}${alpha}`;
}

/** Monaco themes built from the app's CSS tokens (app.css), so the editor follows light/dark. */
export function applyMonacoTheme(mode: 'light' | 'dark') {
	const css = getComputedStyle(document.documentElement);
	const v = (name: string) => toMonacoHex(css.getPropertyValue(name).trim());
	const builtIn = mode === 'dark' ? 'vs-dark' : 'vs';
	const name = `j2o-${mode}`;
	try {
		monaco.editor.defineTheme(name, {
			base: builtIn,
			inherit: true,
			rules: [],
			colors: {
				'editor.background': v('--editor-bg'),
				'editor.foreground': v('--text'),
				'editorLineNumber.foreground': v('--text-3'),
				'editorLineNumber.activeForeground': v('--text-2'),
				'editor.lineHighlightBackground': v('--editor-line'),
				'editorGutter.background': v('--editor-bg'),
				'editorWidget.background': v('--bg-2'),
				'editorWidget.border': v('--line'),
				'scrollbarSlider.background': v('--scroll'),
				focusBorder: v('--accent')
			}
		});
		monaco.editor.setTheme(name);
	} catch (err) {
		// A bad token must never cost the editor: fall back to Monaco's own theme.
		console.warn('[json2openapi] custom editor theme rejected', err);
		monaco.editor.setTheme(builtIn);
	}
}
