<script lang="ts">
	// The converter: JSON input (left) → OpenAPI / TypeScript / Zod / tree (right). Converts as you type.
	// Initial input, in order: share link (#s=…) → last draft → bundled example.
	import { onMount } from 'svelte';
	import example from '#lib/example.json';
	import Editor from '#lib/components/Editor.svelte';
	import Header from '#lib/components/Header.svelte';
	import OptionsBar from '#lib/components/OptionsBar.svelte';
	import SchemaTree from '#lib/components/SchemaTree.svelte';
	import HistoryPanel from '#lib/components/HistoryPanel.svelte';
	import ShortcutsDialog from '#lib/components/ShortcutsDialog.svelte';
	import DropZone from '#lib/components/DropZone.svelte';
	import Icon, { type IconName } from '#lib/components/Icon.svelte';
	import { base } from '#lib/client/base.ts';
	import { prefs, loadPrefs, savePrefs } from '#lib/client/prefs.svelte.ts';
	import { history, loadHistory, remember } from '#lib/client/history.svelte.ts';
	import { readJson, removeKey, writeJson } from '#lib/client/storage.ts';
	import { toast } from '#lib/client/toast.svelte.ts';
	import { convert, downloadInfo, type Outputs } from '#lib/convert.ts';
	import { parseJson } from '#lib/parse.ts';
	import { decodeShare, encodeShare, shareToken, SHARE_WARN_LENGTH } from '#lib/share.ts';
	import { actionFor } from '#lib/shortcuts.ts';
	import { TABS, type Tab } from '#lib/options.ts';
	import type { HistoryEntry } from '#lib/history.ts';

	const EXAMPLE = JSON.stringify(example, null, 2);
	const DRAFT_KEY = 'draft';
	const DRAFT_MAX = 1_000_000;
	const FILE_MAX = 10 * 1024 * 1024;

	const TAB_INFO: Record<Tab, { label: string; icon: IconName }> = {
		openapi: { label: 'OpenAPI', icon: 'braces' },
		typescript: { label: 'TypeScript', icon: 'file' },
		zod: { label: 'Zod', icon: 'file' },
		tree: { label: 'Tree', icon: 'sliders' }
	};

	let ready = $state(false);
	let input = $state('');
	/** `input` after a short pause in typing: what gets parsed and converted. */
	let settled = $state('');
	let inputEditor = $state<Editor>();
	let fileInput = $state<HTMLInputElement>();
	let historyOpen = $state(false);
	let shortcutsOpen = $state(false);

	// ---------- Conversion ----------

	const parsed = $derived(parseJson(settled));
	/** Last successful outputs, shown dimmed while the input has an error. Cache, not state. */
	let lastGood: Outputs | null = null;
	const result = $derived.by((): { outputs: Outputs | null; stale: boolean; error: string } => {
		const opts = $state.snapshot(prefs.options);
		if (parsed.ok) {
			try {
				lastGood = convert(parsed.value, opts);
				return { outputs: lastGood, stale: false, error: '' };
			} catch (err) {
				console.error('[json2openapi] conversion failed', err);
				return { outputs: lastGood, stale: lastGood != null, error: 'Conversion failed: the input is too deeply nested.' };
			}
		}
		if (parsed.empty) lastGood = null;
		return { outputs: lastGood, stale: lastGood != null, error: '' };
	});

	const tab = $derived(prefs.options.tab);
	const outputText = $derived(
		!result.outputs || tab === 'tree' ? '' : tab === 'openapi' ? result.outputs.openapi : tab === 'typescript' ? result.outputs.typescript : result.outputs.zod
	);
	const outputLanguage = $derived(tab === 'openapi' ? prefs.options.format : 'typescript');
	const marker = $derived(!parsed.ok && parsed.error ? { line: parsed.error.line, column: parsed.error.column, message: parsed.error.message } : null);
	const stats = $derived({ lines: settled ? settled.split('\n').length : 0, size: sizeLabel(new Blob([settled]).size) });

	function sizeLabel(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	}

	$effect(() => {
		const v = input;
		const t = setTimeout(() => (settled = v), v.length > 200_000 ? 500 : 150);
		return () => clearTimeout(t);
	});

	// Draft: survives reloads (including the automatic one when a new version is published).
	$effect(() => {
		const v = settled;
		if (!ready) return;
		if (v.length <= DRAFT_MAX) writeJson(DRAFT_KEY, v);
		else removeKey(DRAFT_KEY);
	});

	// History: a valid input that stays unchanged for a moment (not the untouched example).
	$effect(() => {
		if (!ready || !parsed.ok || settled === EXAMPLE) return;
		const json = settled;
		const value = parsed.value;
		const t = setTimeout(() => remember(json, value), 1500);
		return () => clearTimeout(t);
	});

	$effect(() => {
		if (ready) savePrefs();
	});

	onMount(() => {
		loadPrefs();
		loadHistory();
		(async () => {
			const token = shareToken(location.hash);
			let initial: string | null = null;
			if (token) {
				const shared = await decodeShare(token);
				dropShareHash();
				if (shared) {
					initial = shared.json;
					prefs.options = shared.options;
					toast.info('Loaded a shared conversion');
				} else toast.error('This share link is damaged or from another version', { detail: 'Loaded your last input instead.' });
			}
			if (initial == null) {
				const draft = readJson(DRAFT_KEY);
				initial = typeof draft === 'string' ? draft : EXAMPLE;
			}
			input = settled = initial;
			ready = true;
		})();
	});

	/** Drop the `#s=…` hash so a reload keeps the user's edits instead of re-applying the link. */
	function dropShareHash() {
		window.history.replaceState(window.history.state, '', location.pathname + location.search);
	}

	// ---------- Input actions ----------

	function setInput(text: string) {
		if (inputEditor) inputEditor.replace(text);
		else input = text;
	}

	function format() {
		const r = parseJson(inputEditor?.getValue() ?? input);
		if (r.ok) return setInput(JSON.stringify(r.value, null, 2));
		if (r.empty) return toast.info('Nothing to format yet');
		if (r.error) {
			toast.error(`Can't format: line ${r.error.line}, column ${r.error.column}`, { detail: r.error.message });
			inputEditor?.reveal(r.error.line, r.error.column);
		}
	}

	async function paste() {
		try {
			const text = await navigator.clipboard.readText();
			if (!text.trim()) return toast.info('The clipboard is empty');
			setInput(text);
		} catch {
			toast.info('Clipboard access was blocked', { detail: 'Click the editor and press Ctrl+V (⌘V on macOS).' });
			inputEditor?.focus();
		}
	}

	async function openFile(file: File) {
		if (file.size > FILE_MAX) return toast.error(`${file.name} is too large`, { detail: `The limit is ${sizeLabel(FILE_MAX)}.` });
		try {
			setInput(await file.text());
			toast.success(`Loaded ${file.name}`);
		} catch {
			toast.error(`Could not read ${file.name}`);
		}
	}

	function pickHistory(entry: HistoryEntry) {
		historyOpen = false;
		setInput(entry.json);
	}

	// ---------- Output actions ----------

	async function copyOutput() {
		if (!result.outputs || tab === 'tree') return toast.info(tab === 'tree' ? 'Pick OpenAPI, TypeScript or Zod to copy' : 'Nothing to copy yet');
		try {
			await navigator.clipboard.writeText(outputText);
			toast.success(`Copied ${TAB_INFO[tab].label}${tab === 'openapi' ? ` (${prefs.options.format.toUpperCase()})` : ''}`);
		} catch {
			toast.error('Could not copy to the clipboard', { detail: 'Your browser blocked clipboard access.' });
		}
	}

	function download() {
		if (!result.outputs || tab === 'tree') return toast.info(tab === 'tree' ? 'Pick OpenAPI, TypeScript or Zod to download' : 'Nothing to download yet');
		const { name, type } = downloadInfo(tab, prefs.options);
		const url = URL.createObjectURL(new Blob([outputText], { type }));
		const a = Object.assign(document.createElement('a'), { href: url, download: name });
		a.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
		toast.success(`Downloaded ${name}`);
	}

	async function share() {
		if (!input.trim()) return toast.info('Write or paste some JSON first');
		try {
			const token = await encodeShare({ json: input, options: $state.snapshot(prefs.options) });
			const url = `${location.origin}${base}/#s=${token}`;
			await navigator.clipboard.writeText(url);
			if (url.length > SHARE_WARN_LENGTH)
				toast.warn('Share link copied, but it is very long', {
					detail: `${url.length.toLocaleString()} characters: some apps may cut it. Consider sharing a smaller sample.`
				});
			else toast.success('Share link copied', { detail: 'Anyone with the link sees this input and these options.' });
		} catch {
			toast.error('Could not create the share link', { detail: 'Your browser blocked clipboard access or compression.' });
		}
	}

	// ---------- Keyboard ----------

	function onKey(e: KeyboardEvent) {
		const el = e.target instanceof HTMLElement ? e.target : null;
		const typing = !!el?.closest('input, textarea, select, [contenteditable], .monaco-editor');
		const action = actionFor(e, typing);
		if (!action) return;
		e.preventDefault();
		e.stopPropagation();
		if (action === 'format') format();
		else if (action === 'copy') void copyOutput();
		else if (action === 'download') download();
		else if (action === 'share') void share();
		else if (action === 'history') historyOpen = !historyOpen;
		else if (action === 'help') shortcutsOpen = true;
		else prefs.options.tab = TABS[Number(action.slice(3)) - 1];
	}

	// ---------- Split (wide screens) ----------

	let split = $state(clampSplit(Number(readJson('split')) || 50));
	let main = $state<HTMLElement>();
	let dragging = $state(false);

	function clampSplit(v: number) {
		return Math.min(75, Math.max(25, v));
	}
	function dragSplit(e: PointerEvent) {
		if (!dragging || !main) return;
		const r = main.getBoundingClientRect();
		split = clampSplit(((e.clientX - r.left) / r.width) * 100);
	}
	function endSplit() {
		if (!dragging) return;
		dragging = false;
		writeJson('split', Math.round(split));
	}
	function keySplit(e: KeyboardEvent) {
		const step = e.key === 'ArrowLeft' ? -2 : e.key === 'ArrowRight' ? 2 : 0;
		if (!step) return;
		e.preventDefault();
		split = clampSplit(split + step);
		writeJson('split', Math.round(split));
	}
</script>

<svelte:head>
	<title>json2openapi · JSON to OpenAPI 3.1, TypeScript and Zod</title>
</svelte:head>

<svelte:window onkeydowncapture={onKey} onpointermove={dragSplit} onpointerup={endSplit} onpointercancel={endSplit} />

<DropZone onFile={openFile} />
<HistoryPanel open={historyOpen} onClose={() => (historyOpen = false)} onPick={pickHistory} />
<ShortcutsDialog open={shortcutsOpen} onClose={() => (shortcutsOpen = false)} />
<input
	bind:this={fileInput}
	type="file"
	accept=".json,application/json,text/plain"
	class="hidden"
	onchange={(e) => {
		const f = e.currentTarget.files?.[0];
		if (f) void openFile(f);
		e.currentTarget.value = '';
	}}
/>

<div class="flex min-h-dvh flex-col lg:h-dvh" class:select-none={dragging}>
	<Header
		onHistory={() => (historyOpen = true)}
		onShare={share}
		onShortcuts={() => (shortcutsOpen = true)}
		historyCount={history.list.length}
	/>

	<main bind:this={main} class="flex flex-1 flex-col gap-3 p-3 lg:min-h-0 lg:flex-row lg:gap-0" style:--split="{split}%">
		<!-- Input -->
		<section
			class="flex h-[70dvh] min-h-[360px] flex-col overflow-hidden rounded-xl border border-line bg-panel lg:h-auto lg:min-h-0 lg:w-(--split)"
			aria-label="JSON input"
		>
			<div class="flex items-center gap-1 border-b border-line px-3 py-2">
				<h2 class="mr-auto text-sm font-semibold">Input <span class="ml-1 rounded bg-raised px-1.5 py-0.5 font-mono text-[0.68rem] text-fg-2">JSON</span></h2>
				<button class="btn btn-ghost px-2" onclick={() => setInput(EXAMPLE)} title="Load the example"><Icon name="sparkles" /><span class="hidden xl:inline">Example</span></button>
				<button class="btn btn-ghost px-2" onclick={format} title="Format (Alt+Shift+F)"><Icon name="format" /><span class="hidden xl:inline">Format</span></button>
				<button class="btn btn-ghost px-2" onclick={() => fileInput?.click()} title="Open a .json file (or drop it anywhere)"><Icon name="upload" /><span class="hidden xl:inline">Open</span></button>
				<button class="btn btn-ghost px-2" onclick={paste} title="Paste from clipboard"><Icon name="clipboard" /><span class="hidden xl:inline">Paste</span></button>
				<button class="btn btn-ghost btn-icon" onclick={() => { setInput(''); inputEditor?.focus(); }} title="Clear (Ctrl+Z to undo)" aria-label="Clear input"><Icon name="trash" /></button>
			</div>

			<div class="min-h-0 flex-1 bg-(--editor-bg)">
				{#if ready}
					<Editor bind:this={inputEditor} language="json" label="JSON input" value={input} error={marker} onChange={(v) => (input = v)} />
				{/if}
			</div>

			<footer class="flex min-h-9 items-center gap-2 border-t border-line px-3 py-1.5 text-xs" aria-live="polite">
				{#if parsed.ok}
					<span class="flex items-center gap-1 text-ok"><Icon name="check" size={14} />Valid JSON</span>
					<span class="text-fg-3">{stats.lines} lines · {stats.size}</span>
				{:else if parsed.empty}
					<span class="text-fg-3">Type or paste JSON, drop a file, or load the example.</span>
				{:else if parsed.error}
					{@const err = parsed.error}
					<button class="flex min-w-0 items-center gap-1 text-left text-bad hover:underline" onclick={() => inputEditor?.reveal(err.line, err.column)}>
						<Icon name="alert" size={14} class="shrink-0" />
						<span class="truncate">Line {err.line}, column {err.column}: {err.message}</span>
					</button>
				{/if}
			</footer>
		</section>

		<!-- Divider: a focusable separator is an interactive widget per WAI-ARIA (window splitter pattern). -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
		<div
			class="group hidden w-3 shrink-0 cursor-col-resize items-center justify-center lg:flex"
			role="separator"
			aria-orientation="vertical"
			aria-label="Resize panels"
			aria-valuenow={Math.round(split)}
			aria-valuemin={25}
			aria-valuemax={75}
			tabindex="0"
			onpointerdown={(e) => {
				e.preventDefault();
				dragging = true;
			}}
			ondblclick={() => {
				split = 50;
				writeJson('split', 50);
			}}
			onkeydown={keySplit}
		>
			<div class="h-10 w-1 rounded-full bg-line transition-colors group-hover:bg-accent" class:bg-accent={dragging}></div>
		</div>

		<!-- Output -->
		<section
			class="flex h-[70dvh] min-h-[360px] flex-col overflow-hidden rounded-xl border border-line bg-panel lg:h-auto lg:min-h-0 lg:flex-1"
			aria-label="Output"
		>
			<div class="flex items-center gap-1 border-b border-line px-2 py-1.5">
				<div class="flex min-w-0 gap-0.5 overflow-x-auto" role="tablist" aria-label="Output type">
					{#each TABS as t, i (t)}
						<button
							role="tab"
							aria-selected={tab === t}
							class="rounded-md px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors {tab === t ? 'bg-raised text-fg' : 'text-fg-2 hover:text-fg'}"
							onclick={() => (prefs.options.tab = t)}
							title="Alt+{i + 1}">{TAB_INFO[t].label}</button
						>
					{/each}
				</div>
				<div class="ml-auto flex shrink-0 items-center gap-1">
					<button class="btn btn-ghost px-2" onclick={copyOutput} disabled={!result.outputs || tab === 'tree'} title="Copy (Alt+Shift+C)">
						<Icon name="copy" /><span class="hidden sm:inline">Copy</span>
					</button>
					<button class="btn btn-primary px-2.5" onclick={download} disabled={!result.outputs || tab === 'tree'} title="Download (Ctrl+S)">
						<Icon name="download" /><span class="hidden sm:inline">Download</span>
					</button>
				</div>
			</div>

			<OptionsBar />

			<div class="relative min-h-0 flex-1 bg-(--editor-bg)">
				{#if result.outputs}
					<div class="h-full" class:opacity-50={result.stale} class:hidden={tab === 'tree'}>
						<Editor language={outputLanguage} label="{TAB_INFO[tab].label} output" value={outputText} readOnly />
					</div>
					{#if tab === 'tree'}
						<div class="h-full bg-panel" class:opacity-50={result.stale}><SchemaTree tree={result.outputs.tree} /></div>
					{/if}
					{#if result.stale}
						<div class="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
							<span class="rounded-full border border-line bg-panel px-3 py-1 text-xs text-warn shadow">
								{result.error || 'Showing the last valid result: fix the input to update'}
							</span>
						</div>
					{/if}
				{:else if ready}
					<div class="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
						<Icon name="braces" size={36} class="text-fg-3" />
						<p class="max-w-xs text-sm text-fg-2">
							Your schema appears here as soon as the input is valid JSON. Objects, arrays, nulls and mixed types are all inferred.
						</p>
						<div class="flex gap-2">
							<button class="btn" onclick={() => setInput(EXAMPLE)}><Icon name="sparkles" />Load example</button>
							<button class="btn" onclick={() => fileInput?.click()}><Icon name="upload" />Open file</button>
						</div>
					</div>
				{/if}
			</div>
		</section>
	</main>

	<footer class="hidden px-4 pb-2 text-center text-xs text-fg-3 lg:block">
		Everything runs in your browser; nothing is uploaded. Press <kbd class="kbd">?</kbd> for keyboard shortcuts.
	</footer>
</div>
