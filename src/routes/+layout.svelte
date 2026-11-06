<script lang="ts">
	import '../app.css';
	import { onMount, type Snippet } from 'svelte';
	import Toaster from '#lib/components/Toaster.svelte';
	import UpdateNotice from '#lib/components/UpdateNotice.svelte';
	import { initTheme } from '#lib/client/theme.svelte.ts';
	import { registerServiceWorker } from '#lib/client/pwa.ts';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	onMount(() => {
		initTheme();
		void registerServiceWorker();
	});
</script>

<Toaster />
<UpdateNotice />
{@render children()}
