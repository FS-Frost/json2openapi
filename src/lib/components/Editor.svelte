<script lang="ts">
	// Monaco editor (loaded lazily from client/monaco.ts). Two uses:
	// - input (editable): the parent writes with `replace()` (keeps undo) and listens with `onChange`;
	// - output (readOnly): follows the `value` prop, keeping the scroll position.
	import { onMount } from 'svelte';
	import type { editor as MonacoEditor } from 'monaco-editor/editor/editor.api';
	import type { Monaco } from '../client/monaco.ts';
	import { theme } from '../client/theme.svelte.ts';

	export type EditorMarker = { line: number; column: number; message: string };

	interface Props {
		language: string;
		value?: string;
		readOnly?: boolean;
		/** Accessible name of the editor's text area. */
		label: string;
		error?: EditorMarker | null;
		onChange?: (value: string) => void;
		onReady?: () => void;
	}

	let { language, value = '', readOnly = false, label, error = null, onChange, onReady }: Props = $props();

	let host = $state<HTMLDivElement>();
	let monaco = $state<Monaco>();
	let editor = $state<MonacoEditor.IStandaloneCodeEditor>();
	let loadError = $state('');
	/** Set while the parent writes, so `onChange` does not echo its own update. */
	let writing = false;

	export function getValue(): string {
		return editor?.getModel()?.getValue(MONACO_EOL_LF, false) ?? '';
	}

	/** Replaces the whole text as one undoable edit (Ctrl+Z goes back to what was there). */
	export function replace(text: string) {
		const model = editor?.getModel();
		if (!editor || !model) return;
		writing = true;
		editor.pushUndoStop();
		editor.executeEdits('json2openapi', [{ range: model.getFullModelRange(), text }]);
		editor.pushUndoStop();
		editor.setPosition({ lineNumber: 1, column: 1 });
		editor.revealLine(1);
		writing = false;
		onChange?.(text);
	}

	export function focus() {
		editor?.focus();
	}

	export function reveal(line: number, column: number) {
		if (!editor) return;
		editor.revealPositionInCenter({ lineNumber: line, column });
		editor.setPosition({ lineNumber: line, column });
		editor.focus();
	}

	// Monaco's `getValue` takes an EndOfLinePreference enum; LF = 1.
	const MONACO_EOL_LF = 1;

	onMount(() => {
		let disposed = false;
		(async () => {
			try {
				const mod = await import('../client/monaco.ts');
				if (disposed || !host) return;
				monaco = mod.monaco;
				mod.applyMonacoTheme(theme.resolved);
				editor = mod.monaco.editor.create(host, {
					value,
					language,
					readOnly,
					domReadOnly: readOnly,
					ariaLabel: label,
					automaticLayout: true,
					minimap: { enabled: false },
					wordWrap: 'on',
					fontSize: 13,
					lineHeight: 20,
					// Same stack as Tailwind's font-mono (app.css); Tailwind only emits theme vars that are used.
					fontFamily: "'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
					tabSize: 2,
					scrollBeyondLastLine: false,
					renderLineHighlight: readOnly ? 'none' : 'line',
					padding: { top: 10, bottom: 10 },
					fixedOverflowWidgets: true,
					stickyScroll: { enabled: false },
					folding: true,
					// Files are dropped on the page's drop zone, not into the editor.
					dropIntoEditor: { enabled: false }
				});
				editor.onDidChangeModelContent(() => {
					if (!writing && !readOnly) onChange?.(getValue());
				});
				onReady?.();
			} catch (err) {
				console.error('[json2openapi] editor failed to load', err);
				loadError = 'The editor could not be loaded. Reload the page to try again.';
			}
		})();
		return () => {
			disposed = true;
			editor?.getModel()?.dispose();
			editor?.dispose();
		};
	});

	// Theme follows the app (Monaco themes are global, so any editor can set it).
	$effect(() => {
		const mode = theme.resolved;
		if (monaco) import('../client/monaco.ts').then((m) => m.applyMonacoTheme(mode));
	});

	// Read-only outputs follow `value`, keeping the scroll position.
	$effect(() => {
		const next = value;
		const model = editor?.getModel();
		if (!readOnly || !editor || !model || model.getValue() === next) return;
		const view = editor.saveViewState();
		model.setValue(next);
		if (view) editor.restoreViewState(view);
	});

	$effect(() => {
		const model = editor?.getModel();
		if (!monaco || !model) return;
		if (model.getLanguageId() !== language) monaco.editor.setModelLanguage(model, language);
	});

	$effect(() => {
		const model = editor?.getModel();
		if (!monaco || !model) return;
		const markers = error
			? [
					{
						severity: monaco.MarkerSeverity.Error,
						message: error.message,
						startLineNumber: error.line,
						startColumn: error.column,
						endLineNumber: error.line,
						endColumn: error.column + 1
					}
				]
			: [];
		monaco.editor.setModelMarkers(model, 'json2openapi', markers);
	});
</script>

<div class="relative h-full min-h-0 w-full">
	<div bind:this={host} class="absolute inset-0"></div>
	{#if !editor && !loadError}
		<div class="absolute inset-0 flex flex-col gap-2 p-4" aria-hidden="true">
			{#each [70, 45, 60, 30, 55] as w, i (i)}
				<div class="h-3 animate-pulse rounded bg-raised" style:width="{w}%"></div>
			{/each}
		</div>
	{/if}
	{#if loadError}
		<p class="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-bad">{loadError}</p>
	{/if}
</div>
