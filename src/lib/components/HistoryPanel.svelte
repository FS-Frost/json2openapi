<script lang="ts">
	// Side panel with recent conversions (client/history.svelte.ts). Esc or the backdrop closes it.
	import { fade, fly } from 'svelte/transition';
	import { clearHistory, forget, history } from '../client/history.svelte.ts';
	import { ago } from '../client/version.ts';
	import type { HistoryEntry } from '../history.ts';
	import Icon from './Icon.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		onPick: (entry: HistoryEntry) => void;
	}

	let { open, onClose, onPick }: Props = $props();

	let panel = $state<HTMLElement>();

	$effect(() => {
		if (open) panel?.focus();
	});

	const sizeOf = (s: string) => (s.length < 1024 ? `${s.length} B` : `${(s.length / 1024).toFixed(1)} KB`);
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && onClose()} />

{#if open}
	<div class="fixed inset-0 z-40 bg-black/40" transition:fade={{ duration: 120 }} onclick={onClose} aria-hidden="true"></div>
	<aside
		bind:this={panel}
		class="fixed inset-y-0 right-0 z-50 flex w-[min(380px,100vw)] flex-col border-l border-line bg-panel shadow-2xl outline-none"
		transition:fly={{ x: 380, duration: 180 }}
		tabindex="-1"
		aria-label="Recent conversions"
	>
		<div class="flex h-14 items-center gap-2 border-b border-line px-4">
			<Icon name="history" />
			<h2 class="font-semibold">History</h2>
			<span class="text-xs text-fg-3">stored in this browser only</span>
			<button class="btn btn-ghost btn-icon ml-auto" onclick={onClose} aria-label="Close history"><Icon name="x" /></button>
		</div>
		{#if history.list.length === 0}
			<div class="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-fg-3">
				<Icon name="history" size={28} />
				<p>Valid inputs you convert show up here, so you can come back to them.</p>
			</div>
		{:else}
			<ul class="min-h-0 flex-1 overflow-auto p-2">
				{#each history.list as entry (entry.id)}
					<li class="group flex items-center gap-1 rounded-lg hover:bg-raised">
						<button class="min-w-0 flex-1 px-3 py-2 text-left" onclick={() => onPick(entry)}>
							<div class="truncate font-mono text-[0.8rem] text-fg">{entry.label}</div>
							<div class="text-xs text-fg-3">{ago(new Date(entry.at).toISOString())} · {sizeOf(entry.json)}</div>
						</button>
						<button
							class="btn btn-ghost btn-icon mr-1 opacity-60 group-hover:opacity-100"
							onclick={() => forget(entry.id)}
							aria-label="Remove {entry.label} from history"
						>
							<Icon name="trash" size={14} />
						</button>
					</li>
				{/each}
			</ul>
			<div class="border-t border-line p-3">
				<button class="btn w-full" onclick={clearHistory}><Icon name="trash" size={14} />Clear history</button>
			</div>
		{/if}
	</aside>
{/if}
