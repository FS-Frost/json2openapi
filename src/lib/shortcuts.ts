// Keyboard shortcuts. Alt+Shift combos avoid browser bindings (Ctrl+Shift+C opens DevTools in Chrome) and match
// Monaco's own Shift+Alt+F. Matched by `event.code`, so they work on any keyboard layout and with macOS Option.

export type Action = 'format' | 'copy' | 'download' | 'share' | 'history' | 'help' | 'tab1' | 'tab2' | 'tab3' | 'tab4';

export const SHORTCUTS: { action: Action; label: string; keys: string[] }[] = [
	{ action: 'format', label: 'Format input JSON', keys: ['Alt', 'Shift', 'F'] },
	{ action: 'copy', label: 'Copy output', keys: ['Alt', 'Shift', 'C'] },
	{ action: 'download', label: 'Download output', keys: ['Mod', 'S'] },
	{ action: 'share', label: 'Copy share link', keys: ['Alt', 'Shift', 'S'] },
	{ action: 'history', label: 'Open history', keys: ['Alt', 'Shift', 'H'] },
	{ action: 'tab1', label: 'OpenAPI / TypeScript / Zod / Tree', keys: ['Alt', '1…4'] },
	{ action: 'help', label: 'This help', keys: ['?'] }
];

type KeyLike = Pick<KeyboardEvent, 'code' | 'key' | 'altKey' | 'shiftKey' | 'ctrlKey' | 'metaKey'>;

/** The action for a key event, or null. `typing`: focus is in a text field (then `?` types a question mark). */
export function actionFor(e: KeyLike, typing: boolean): Action | null {
	const mod = e.ctrlKey || e.metaKey;
	if (e.altKey && e.shiftKey && !mod) {
		if (e.code === 'KeyF') return 'format';
		if (e.code === 'KeyC') return 'copy';
		if (e.code === 'KeyS') return 'share';
		if (e.code === 'KeyH') return 'history';
	}
	if (mod && !e.altKey && !e.shiftKey && e.code === 'KeyS') return 'download';
	if (e.altKey && !e.shiftKey && !mod) {
		const n = /^Digit([1-4])$/.exec(e.code)?.[1];
		if (n) return `tab${n}` as Action; // `as`: the regex only lets 1-4 through
	}
	if (!typing && e.key === '?' && !mod && !e.altKey) return 'help';
	return null;
}
