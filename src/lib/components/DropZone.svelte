<script lang="ts">
	// Whole-window file drop: an overlay appears while files are dragged over the page.
	import { fade } from 'svelte/transition';
	import Icon from './Icon.svelte';

	interface Props {
		onFile: (file: File) => void;
	}

	let { onFile }: Props = $props();

	let depth = $state(0);
	const hasFiles = (e: DragEvent) => !!e.dataTransfer?.types.includes('Files');

	function enter(e: DragEvent) {
		if (!hasFiles(e)) return;
		e.preventDefault();
		depth++;
	}
	function over(e: DragEvent) {
		if (!hasFiles(e)) return;
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
	}
	function leave(e: DragEvent) {
		if (!hasFiles(e)) return;
		depth = Math.max(0, depth - 1);
	}
	function drop(e: DragEvent) {
		if (!hasFiles(e)) return;
		e.preventDefault();
		depth = 0;
		const file = e.dataTransfer?.files[0];
		if (file) onFile(file);
	}
</script>

<svelte:window ondragenter={enter} ondragover={over} ondragleave={leave} ondrop={drop} />

{#if depth > 0}
	<div class="pointer-events-none fixed inset-0 z-60 grid place-items-center bg-canvas/80 p-6 backdrop-blur-sm" transition:fade={{ duration: 100 }}>
		<div class="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-accent px-12 py-10 text-center">
			<Icon name="upload" size={32} class="text-accent" />
			<p class="text-lg font-semibold">Drop a JSON file</p>
			<p class="text-sm text-fg-2">It replaces the input (Ctrl+Z brings the previous one back).</p>
		</div>
	</div>
{/if}
