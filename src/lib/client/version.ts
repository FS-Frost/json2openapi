// App version = short sha of the published commit (vite.config.ts → Kit `version.name`; "dev" locally).
// Pure logic only (tested); the notice lives in components/UpdateNotice.svelte.

const KEY = 'json2openapi.version';

/** Stores the current version and returns the previous one if it changed (null the first time, if unchanged or "dev"). */
export function noteVersion(
	current: string,
	store: Pick<Storage, 'getItem' | 'setItem'> | null = safeStorage()
): string | null {
	if (!store || current === 'dev') return null;
	try {
		const prev = store.getItem(KEY);
		if (prev === current) return null;
		store.setItem(KEY, current);
		return prev;
	} catch {
		return null;
	}
}

function safeStorage() {
	try {
		return localStorage;
	} catch {
		return null;
	}
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
	['year', 365 * 86400],
	['month', 30 * 86400],
	['week', 7 * 86400],
	['day', 86400],
	['hour', 3600],
	['minute', 60]
];

/** "3 minutes ago", "yesterday", "2 weeks ago"… ("just now" under a minute). */
export function ago(iso: string, now = Date.now()) {
	const s = Math.round((now - Date.parse(iso)) / 1000);
	if (!Number.isFinite(s)) return '';
	if (s < 60) return 'just now';
	for (const [unit, secs] of STEPS) if (s >= secs) return rtf.format(-Math.floor(s / secs), unit);
	return '';
}
