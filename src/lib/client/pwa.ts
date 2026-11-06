// PWA: service worker registration (build only; in dev Vite does not produce it and the cache gets in the way).
// Update: the new SW installs and WAITS; `applyUpdate` activates it and reloads (notice in UpdateNotice.svelte).
// Ported from sensei.
import { base } from './base.ts';

export const CACHE_PREFIX = 'json2openapi-';

let reg: ServiceWorkerRegistration | undefined;

export async function registerServiceWorker() {
	if (typeof navigator === 'undefined' || !('serviceWorker' in navigator) || import.meta.env.DEV) return;
	try {
		reg = await navigator.serviceWorker.register(`${base}/service-worker.js`, { scope: `${base}/` });
		// A waiting SW on open: this page came from the network (navigation is network-first), so it already is the
		// new version. Activating it breaks nothing and refreshes the offline cache.
		if (reg.waiting && navigator.serviceWorker.controller) reg.waiting.postMessage('SKIP_WAITING');
	} catch (err) {
		console.error('[json2openapi] service worker registration failed', err);
	}
}

/** Waits for an installing SW to finish (installed or discarded), at most `ms`. */
function installed(w: ServiceWorker, ms = 20_000) {
	return new Promise<ServiceWorker | null>((resolve) => {
		const done = () => {
			if (w.state === 'installed' || w.state === 'activated') resolve(w);
			else if (w.state === 'redundant') resolve(null);
		};
		w.addEventListener('statechange', done);
		setTimeout(() => resolve(null), ms);
		done();
	});
}

/** Version requested by "Update" (to detect, after reloading, that it did not arrive). */
const TARGET = 'json2openapi.updateTarget';

async function publishedVersion() {
	const res = await fetch(`${base}/_app/version.json`, { cache: 'no-cache' });
	return ((await res.json()) as { version: string }).version; // `as`: Kit's own version.json format
}

/**
 * Is the hosted shell already that version? Right after publishing, the GitHub Pages CDN may serve the new
 * `version.json` and, for a few minutes, the old `index.html`: reloading then would land on the old version.
 */
async function shellIs(version: string) {
	const html = await (await fetch(`${base}/`, { cache: 'reload' })).text();
	return html.includes(`version: "${version}"`) || html.includes(`version:"${version}"`);
}

export type UpdateResult = 'reloading' | 'publishing' | 'offline';

let applying = false;

/** Moves to the published version once it is really served; otherwise says why not. */
export async function applyUpdate(): Promise<UpdateResult> {
	if (applying) return 'reloading';
	applying = true;
	let target: string;
	try {
		target = await publishedVersion();
		if (!(await shellIs(target))) {
			applying = false;
			return 'publishing';
		}
	} catch {
		applying = false;
		return 'offline';
	}
	try {
		sessionStorage.setItem(TARGET, target);
	} catch {
		/* no storage: a failed update cannot be reported */
	}
	let reloaded = false;
	const reload = () => {
		if (reloaded) return;
		reloaded = true;
		location.reload();
	};
	const r = reg ?? (await navigator.serviceWorker?.getRegistration(`${base}/`).catch(() => undefined));
	if (!r || !navigator.serviceWorker.controller) {
		reload();
		return 'reloading';
	}
	try {
		await r.update();
	} catch {
		/* the shell already arrived: reload anyway */
	}
	const next = r.waiting ?? (r.installing ? await installed(r.installing) : null);
	if (!next || next === navigator.serviceWorker.controller) {
		reload();
		return 'reloading';
	}
	navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true });
	next.postMessage('SKIP_WAITING');
	setTimeout(reload, 4000); // fallback if `controllerchange` never comes
	return 'reloading';
}

/** After an "Update" reload: the requested version if it is NOT the running one, else null. Consumed once. */
export function failedUpdate(current: string) {
	try {
		const t = sessionStorage.getItem(TARGET);
		sessionStorage.removeItem(TARGET);
		return t && t !== current ? t : null;
	} catch {
		return null;
	}
}

/** Last resort: remove the service worker and the app caches (not prefs/history) and reload from the network. */
export async function forceReload() {
	try {
		for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
		for (const k of await caches.keys()) if (k.startsWith(CACHE_PREFIX)) await caches.delete(k);
	} catch {
		/* reload anyway */
	}
	location.reload();
}
