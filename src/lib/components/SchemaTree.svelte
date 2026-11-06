<script lang="ts">
	// Collapsible view of the inferred schema: name, type, required/optional, nullable.
	import { countNodes, type TreeNode } from '../tree.ts';
	import Icon from './Icon.svelte';

	interface Props {
		tree: TreeNode;
	}

	let { tree }: Props = $props();

	/** Bumped to remount every <details> with the requested open state. */
	let generation = $state(0);
	let openAll = $state(true);

	const total = $derived(countNodes(tree));

	function setAll(open: boolean) {
		openAll = open;
		generation++;
	}

	const TYPE_COLOR: Record<string, string> = {
		string: 'text-ok',
		integer: 'text-info',
		number: 'text-info',
		boolean: 'text-warn',
		null: 'text-fg-3',
		object: 'text-accent',
		any: 'text-fg-3'
	};
	const colorOf = (type: string) => TYPE_COLOR[type.split(/[<| ]/)[0]] ?? 'text-accent';
</script>

{#snippet row(node: TreeNode, depth: number)}
	<div class="flex min-w-0 items-center gap-2 py-1 font-mono text-[0.8rem]">
		<span class="truncate text-fg">{node.name}</span>
		<span class="truncate {colorOf(node.type)}">{node.type}</span>
		{#if depth > 0}
			{#if node.required}
				<span class="rounded bg-raised px-1.5 font-sans text-[0.65rem] text-fg-2" title="Present in every sample">required</span>
			{:else}
				<span class="rounded border border-dashed border-line px-1.5 font-sans text-[0.65rem] text-fg-3" title="Missing in some array items"
					>optional</span
				>
			{/if}
		{/if}
		{#if node.nullable}
			<span class="rounded bg-raised px-1.5 font-sans text-[0.65rem] text-warn">nullable</span>
		{/if}
	</div>
{/snippet}

{#snippet branch(node: TreeNode, depth: number)}
	{#if node.children.length}
		<details open={openAll} class="group">
			<summary class="flex cursor-pointer list-none items-center gap-1 rounded-md pr-2 hover:bg-raised">
				<Icon name="chevron" size={14} class="shrink-0 text-fg-3 transition-transform group-open:rotate-90" />
				{@render row(node, depth)}
			</summary>
			<div class="ml-[0.45rem] border-l border-line pl-3">
				{#each node.children as child (child.name)}
					{@render branch(child, depth + 1)}
				{/each}
			</div>
		</details>
	{:else}
		<div class="pl-[18px]">{@render row(node, depth)}</div>
	{/if}
{/snippet}

<div class="flex h-full min-h-0 flex-col">
	<div class="flex items-center gap-2 border-b border-line px-3 py-1.5 text-xs text-fg-3">
		<span>{total} propert{total === 1 ? 'y' : 'ies'}</span>
		<span class="ml-auto"></span>
		<button class="btn btn-ghost px-2 py-0.5 text-xs" onclick={() => setAll(true)}>Expand all</button>
		<button class="btn btn-ghost px-2 py-0.5 text-xs" onclick={() => setAll(false)}>Collapse all</button>
	</div>
	<div class="min-h-0 flex-1 overflow-auto p-3">
		{#key generation}
			{@render branch(tree, 0)}
		{/key}
	</div>
</div>
