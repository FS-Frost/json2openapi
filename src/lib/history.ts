// Recent conversions (pure logic; storage in client/history.svelte.ts). Newest first, deduplicated by content hash.
import type { Json } from './infer/infer.ts';

export type HistoryEntry = { id: string; json: string; label: string; at: number };

export const HISTORY_MAX = 20;
/** Bigger inputs are not kept (localStorage holds ~5 MB per origin). */
export const HISTORY_MAX_CHARS = 200_000;

/** FNV-1a 32-bit, hex. Identity of an input, not security. */
export function hashText(s: string): string {
	let h = 0x811c9dc5;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return (h >>> 0).toString(16).padStart(8, '0');
}

/** Short description: `{ id, name, tags, … }`, `[3 items]`, `"text"`. */
export function labelFor(value: Json, maxKeys = 3): string {
	if (Array.isArray(value)) return `[${value.length} item${value.length === 1 ? '' : 's'}]`;
	if (value !== null && typeof value === 'object') {
		const keys = Object.keys(value);
		if (!keys.length) return '{ }';
		const shown = keys.slice(0, maxKeys).join(', ');
		return `{ ${shown}${keys.length > maxKeys ? ', …' : ''} }`;
	}
	const s = JSON.stringify(value);
	return s.length > 40 ? s.slice(0, 39) + '…' : s;
}

/** Same input (whitespace ignored) moves to the top instead of repeating. */
export function addToHistory(list: HistoryEntry[], json: string, value: Json, now = Date.now()): HistoryEntry[] {
	if (json.length > HISTORY_MAX_CHARS) return list;
	const id = hashText(JSON.stringify(value));
	const entry: HistoryEntry = { id, json, label: labelFor(value), at: now };
	return [entry, ...list.filter((e) => e.id !== id)].slice(0, HISTORY_MAX);
}

/** Valid entries from stored data (anything else is dropped). */
export function normalizeHistory(raw: unknown): HistoryEntry[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.filter(
			(e): e is HistoryEntry =>
				typeof e === 'object' &&
				e !== null &&
				typeof e.id === 'string' &&
				typeof e.json === 'string' &&
				typeof e.label === 'string' &&
				typeof e.at === 'number'
		)
		.slice(0, HISTORY_MAX);
}
