<script lang="ts">
	// Keyboard shortcuts reference (native <dialog>: focus trap and Esc for free).
	import { SHORTCUTS } from '../shortcuts.ts';
	import Icon from './Icon.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	let dialog = $state<HTMLDialogElement>();
	const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});

	const keyLabel = (k: string) => (mac ? k.replace('Alt', '⌥').replace('Shift', '⇧').replace('Mod', '⌘') : k.replace('Mod', 'Ctrl'));
</script>

<dialog
	bind:this={dialog}
	onclose={onClose}
	onclick={(e) => e.target === dialog && onClose()}
	class="m-auto w-[min(420px,calc(100vw-2rem))] rounded-xl border border-line bg-panel p-0 text-fg shadow-2xl backdrop:bg-black/50"
>
	<div class="flex items-center gap-2 border-b border-line px-4 py-3">
		<Icon name="keyboard" />
		<h2 class="font-semibold">Keyboard shortcuts</h2>
		<button class="btn btn-ghost btn-icon ml-auto" onclick={onClose} aria-label="Close"><Icon name="x" /></button>
	</div>
	<dl class="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2.5 p-4 text-sm">
		{#each SHORTCUTS as s (s.label)}
			<dt class="text-fg-2">{s.label}</dt>
			<dd class="flex justify-end gap-1">
				{#each s.keys as k (k)}<kbd class="kbd">{keyLabel(k)}</kbd>{/each}
			</dd>
		{/each}
	</dl>
</dialog>
