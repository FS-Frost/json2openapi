<script lang="ts">
	// New app version (short sha of the published commit), announced with toasts:
	// - when the tab becomes visible again and a new version is published, it updates by itself (reload);
	// - if it arrives while the tab is visible, a toast offers "Update" (no reload in the middle of an edit);
	// - after updating, "json2openapi updated (sha)"; if the reload did not bring the requested version, an error toast
	//   offers "Force" (removes the service worker and the app cache; prefs and history stay). Ported from sensei.
	import { onMount } from 'svelte';
	import { updated } from '$app/state';
	import { version } from '$app/env';
	import { applyUpdate, failedUpdate, forceReload } from '../client/pwa.ts';
	import { ago, noteVersion } from '../client/version.ts';
	import { toast } from '../client/toast.svelte.ts';

	const builtAt = import.meta.env.VITE_BUILT_AT as string | undefined; // `as`: injected by vite.config.ts

	function offer() {
		toast.info('A new version of json2openapi is available', {
			duration: null,
			key: 'version',
			actions: [{ label: 'Update', run: update, keep: true }]
		});
	}

	async function update() {
		toast.info('Updating…', { duration: null, key: 'version', persistent: true, detail: 'The page will reload in a few seconds.' });
		const r = await applyUpdate();
		if (r === 'publishing')
			toast.warn('The new version is still being published', {
				detail: 'The server still serves the previous one. Try again in a couple of minutes.',
				duration: null,
				key: 'version',
				actions: [{ label: 'Retry', run: update, keep: true }]
			});
		else if (r === 'offline')
			toast.warn('Offline: could not update', { key: 'version', actions: [{ label: 'Retry', run: update, keep: true }] });
	}

	onMount(() => {
		const missed = version === 'dev' ? null : failedUpdate(version);
		if (missed)
			toast.error(`The new version (${missed}) did not load`, {
				detail: 'You are still on the previous one. "Force" downloads the app again (your history is kept).',
				key: 'version',
				actions: [{ label: 'Force', run: forceReload, keep: true }]
			});
		else if (noteVersion(version) !== null)
			toast.success(`json2openapi updated (${version})`, {
				detail: builtAt ? `Published ${ago(builtAt)}.` : undefined,
				duration: 6000,
				key: 'version'
			});
		const onVisible = async () => {
			if (document.visibilityState !== 'visible' || version === 'dev') return;
			try {
				if (updated.current || (await updated.check())) await applyUpdate();
			} catch {
				/* offline: checked next time */
			}
		};
		document.addEventListener('visibilitychange', onVisible);
		return () => document.removeEventListener('visibilitychange', onVisible);
	});

	$effect(() => {
		if (updated.current) offer();
	});
</script>
