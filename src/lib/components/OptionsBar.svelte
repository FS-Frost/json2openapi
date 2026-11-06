<script lang="ts">
	// Options for the current output tab. Mutates `prefs.options` (the page persists it).
	import { slide } from 'svelte/transition';
	import { prefs } from '../client/prefs.svelte.ts';
	import { METHODS } from '../options.ts';
	import Icon from './Icon.svelte';

	let docOpen = $state(false);
	const o = $derived(prefs.options);
	const showDoc = $derived(o.tab === 'openapi' && o.mode === 'document');
</script>

<div class="border-b border-line bg-panel px-3 py-2">
	<div class="flex flex-wrap items-center gap-x-3 gap-y-2">
		{#if o.tab === 'openapi'}
			<div class="seg" role="group" aria-label="Output format">
				<button class="seg-btn" aria-pressed={o.format === 'yaml'} onclick={() => (prefs.options.format = 'yaml')}>YAML</button>
				<button class="seg-btn" aria-pressed={o.format === 'json'} onclick={() => (prefs.options.format = 'json')}>JSON</button>
			</div>
			<div class="seg" role="group" aria-label="Output scope">
				<button class="seg-btn" aria-pressed={o.mode === 'schema'} onclick={() => (prefs.options.mode = 'schema')}>Schema</button>
				<button class="seg-btn" aria-pressed={o.mode === 'document'} onclick={() => (prefs.options.mode = 'document')}>Document</button>
			</div>
			<label class="flex cursor-pointer items-center gap-1.5 text-xs text-fg-2" title="Extract objects to components/schemas and reference them with $ref">
				<input type="checkbox" class="accent-accent" bind:checked={prefs.options.refs} />
				<code class="font-mono">$ref</code> components
			</label>
		{/if}
		{#if o.tab !== 'tree'}
			<label class="flex items-center gap-1.5 text-xs text-fg-2">
				Root
				<input
					class="field w-28 py-1 font-mono text-xs"
					value={o.rootName}
					oninput={(e) => (prefs.options.rootName = e.currentTarget.value.trim() || 'Root')}
					spellcheck="false"
					aria-label="Root schema name"
				/>
			</label>
		{/if}
		{#if showDoc}
			<button class="btn btn-ghost ml-auto px-2 py-1 text-xs" onclick={() => (docOpen = !docOpen)} aria-expanded={docOpen}>
				<Icon name="sliders" size={14} />Document settings
				<Icon name="chevron" size={14} class="transition-transform {docOpen ? 'rotate-90' : ''}" />
			</button>
		{/if}
	</div>

	{#if showDoc && docOpen}
		<div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6" transition:slide={{ duration: 150 }}>
			<label class="col-span-2 sm:col-span-1 xl:col-span-2">
				<span class="label">Title</span>
				<input class="field" bind:value={prefs.options.doc.title} />
			</label>
			<label>
				<span class="label">Version</span>
				<input class="field" bind:value={prefs.options.doc.version} />
			</label>
			<label>
				<span class="label">Method</span>
				<select class="field uppercase" bind:value={prefs.options.doc.method}>
					{#each METHODS as m (m)}<option value={m}>{m.toUpperCase()}</option>{/each}
				</select>
			</label>
			<label>
				<span class="label">Path</span>
				<input
					class="field font-mono"
					value={o.doc.path}
					oninput={(e) => {
						const v = e.currentTarget.value.trim();
						prefs.options.doc.path = v.startsWith('/') ? v : `/${v}`;
					}}
					spellcheck="false"
				/>
			</label>
			<label>
				<span class="label">Status</span>
				<input
					class="field font-mono"
					value={o.doc.status}
					inputmode="numeric"
					maxlength="3"
					oninput={(e) => {
						const v = e.currentTarget.value;
						if (/^[1-5]\d\d$/.test(v)) prefs.options.doc.status = v;
					}}
				/>
			</label>
			<div class="col-span-2 sm:col-span-3 xl:col-span-6">
				<span class="label">Sample is the…</span>
				<div class="seg" role="group" aria-label="Sample placement">
					<button class="seg-btn" aria-pressed={o.doc.placement === 'response'} onclick={() => (prefs.options.doc.placement = 'response')}
						>Response body</button
					>
					<button class="seg-btn" aria-pressed={o.doc.placement === 'request'} onclick={() => (prefs.options.doc.placement = 'request')}
						>Request body</button
					>
				</div>
			</div>
		</div>
	{/if}
</div>
