/// <reference lib="webworker" />
// Service worker (PWA): the app opens offline. Precaches the shell, every hashed file (Monaco included) and static
// assets. Registered by hand in production (client/pwa.ts). Ported from sensei.
import { immutable, assets } from '$app/manifest';
import { version } from '$app/env';

// `as`: the standard cast for a SW module (TS types `self` as Window in this compilation unit).
const sw = self as unknown as ServiceWorkerGlobalScope;

// Served at `<base>/service-worker.js`: the site base comes from there.
const BASE = sw.location.pathname.replace(/\/service-worker\.js$/, '');
const SHELL = `${BASE}/`;
const CACHE = `json2openapi-${version}`;

const url = (p: string) => `${BASE}/${p.replace(/^\//, '')}`;
const PRECACHE = [...immutable.map((f) => url(f.path)), ...assets.map((f) => url(f.path))];
const PRECACHED = new Set(PRECACHE);

/**
 * Kit lists worker entry points but not every chunk they import (Monaco's editor/JSON workers). Follow references
 * from client chunks to /_app/immutable/workers/… and relative imports inside workers, so the editor works offline
 * from the first visit.
 */
async function precacheWorkerGraph(cache: Cache) {
	const seen = new Set<string>(PRECACHE);
	const isWorker = (p: string) => p.includes('/_app/immutable/workers/');
	const queue = PRECACHE.filter((p) => p.endsWith('.js'));
	while (queue.length) {
		const p = queue.shift()!;
		const res = await cache.match(p);
		if (!res) continue;
		const js = await res.text();
		const refs = [
			...[...js.matchAll(/[`"']([^`"'\s]*\/_app\/immutable\/workers\/[\w./-]+\.js)[`"']/g)].map((m) => m[1]),
			...(isWorker(p)
				? [...js.matchAll(/[`"'](\.{1,2}\/[\w./-]+\.js)[`"']/g)].map(
						(m) => new URL(m[1], new URL(p, sw.location.origin)).pathname
					)
				: [])
		];
		for (const r of refs) {
			const path = new URL(r, sw.location.origin).pathname;
			if (seen.has(path)) continue;
			seen.add(path);
			try {
				await cache.add(path);
				queue.push(path);
			} catch {
				/* a match that is not a real file: ignored */
			}
		}
	}
}

sw.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE);
			await cache.addAll([...PRECACHE, SHELL]);
			await precacheWorkerGraph(cache);
			// No skipWaiting: an old page still open could lose the cache it lazily loads chunks from.
			// The page asks for it (client/pwa.ts → applyUpdate) right before reloading.
		})()
	);
});

sw.addEventListener('message', (event) => {
	if (event.data === 'SKIP_WAITING') void sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) if (key.startsWith('json2openapi-') && key !== CACHE) await caches.delete(key);
			await sw.clients.claim();
		})()
	);
});

sw.addEventListener('fetch', (event) => {
	const req = event.request;
	const u = new URL(req.url);
	if (req.method !== 'GET' || u.origin !== sw.location.origin) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			// Hashed files and static assets: cache first.
			if (PRECACHED.has(u.pathname) || u.pathname.startsWith(`${BASE}/_app/immutable/`)) {
				const hit = await cache.match(u.pathname);
				if (hit) return hit;
			}
			// Navigation (SPA): network first; offline, the shell.
			if (req.mode === 'navigate') {
				try {
					return await fetch(req);
				} catch {
					return (await cache.match(SHELL)) ?? Response.error();
				}
			}
			// Everything else (version.json…): network, filling the cache; offline, what was cached.
			try {
				const res = await fetch(req);
				if (res.ok && res.type === 'basic') void cache.put(req, res.clone());
				return res;
			} catch {
				return (await cache.match(req)) ?? Response.error();
			}
		})()
	);
});
