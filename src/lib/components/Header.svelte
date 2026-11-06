<script lang="ts">
	import { version } from '$app/env';
	import { cycleTheme, theme, type ThemeMode } from '../client/theme.svelte.ts';
	import Icon, { type IconName } from './Icon.svelte';

	interface Props {
		onHistory: () => void;
		onShare: () => void;
		onShortcuts: () => void;
		historyCount: number;
	}

	let { onHistory, onShare, onShortcuts, historyCount }: Props = $props();

	const THEME: Record<ThemeMode, { icon: IconName; label: string }> = {
		light: { icon: 'sun', label: 'Theme: light' },
		dark: { icon: 'moon', label: 'Theme: dark' },
		system: { icon: 'monitor', label: 'Theme: system' }
	};
	const REPO = 'https://github.com/FS-Frost/json2openapi';
</script>

<header class="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-panel px-3 sm:px-4">
	<div class="flex min-w-0 items-center gap-2.5">
		<span class="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-ink">
			<Icon name="braces" size={18} />
		</span>
		<div class="min-w-0 leading-tight">
			<h1 class="truncate text-[0.95rem] font-semibold tracking-tight">json2openapi</h1>
			<p class="hidden truncate text-xs text-fg-3 sm:block">JSON → OpenAPI 3.1 · TypeScript · Zod</p>
		</div>
		{#if version !== 'dev'}
			<a
				class="hidden rounded-full border border-line px-2 py-0.5 font-mono text-[0.68rem] text-fg-3 hover:text-fg md:inline"
				href="{REPO}/commit/{version}"
				target="_blank"
				rel="noreferrer"
				title="Deployed version">{version}</a
			>
		{/if}
	</div>

	<nav class="ml-auto flex items-center gap-0.5" aria-label="App">
		<button class="btn btn-ghost" onclick={onShare} title="Copy a share link (Alt+Shift+S)">
			<Icon name="link" /><span class="hidden sm:inline">Share</span>
		</button>
		<button class="btn btn-ghost relative" onclick={onHistory} title="Recent conversions (Alt+Shift+H)">
			<Icon name="history" /><span class="hidden sm:inline">History</span>
			{#if historyCount > 0}
				<span class="rounded-full bg-raised px-1.5 text-[0.68rem] text-fg-2">{historyCount}</span>
			{/if}
		</button>
		<button class="btn btn-ghost btn-icon hidden sm:inline-flex" onclick={onShortcuts} title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts">
			<Icon name="keyboard" />
		</button>
		<button
			class="btn btn-ghost btn-icon"
			onclick={cycleTheme}
			title="{THEME[theme.mode].label} (click to change)"
			aria-label={THEME[theme.mode].label}
		>
			<Icon name={THEME[theme.mode].icon} />
		</button>
		<a class="btn btn-ghost btn-icon" href={REPO} target="_blank" rel="noreferrer" title="Source on GitHub" aria-label="Source on GitHub">
			<Icon name="github" />
		</a>
	</nav>
</header>
