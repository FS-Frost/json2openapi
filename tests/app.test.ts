import { describe, expect, test } from 'bun:test';
import { actionFor, type Action } from '#lib/shortcuts.ts';
import { ago, noteVersion } from '#lib/client/version.ts';

const key = (code: string, mods: Partial<Record<'altKey' | 'shiftKey' | 'ctrlKey' | 'metaKey', boolean>> = {}, k = '') => ({
	code,
	key: k,
	altKey: false,
	shiftKey: false,
	ctrlKey: false,
	metaKey: false,
	...mods
});

describe('shortcuts', () => {
	const cases: [string, ReturnType<typeof key>, boolean, Action | null][] = [
		['Alt+Shift+F formats', key('KeyF', { altKey: true, shiftKey: true }), true, 'format'],
		['Alt+Shift+C copies', key('KeyC', { altKey: true, shiftKey: true }), false, 'copy'],
		['Ctrl+S downloads', key('KeyS', { ctrlKey: true }), true, 'download'],
		['Cmd+S downloads', key('KeyS', { metaKey: true }), true, 'download'],
		['Alt+Shift+S shares', key('KeyS', { altKey: true, shiftKey: true }), false, 'share'],
		['Alt+2 → second tab', key('Digit2', { altKey: true }), true, 'tab2'],
		['Alt+5 → nothing', key('Digit5', { altKey: true }), true, null],
		['? opens help', key('Slash', { shiftKey: true }, '?'), false, 'help'],
		['? while typing types', key('Slash', { shiftKey: true }, '?'), true, null],
		['Ctrl+Shift+C is left to the browser', key('KeyC', { ctrlKey: true, shiftKey: true }), false, null],
		['plain F does nothing', key('KeyF'), false, null]
	];
	for (const [name, e, typing, action] of cases) test(name, () => expect(actionFor(e, typing)).toBe(action));
});

describe('version', () => {
	const store = () => {
		const m = new Map<string, string>();
		return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
	};
	test('first visit and same version → null; a change → previous', () => {
		const s = store();
		expect(noteVersion('aaa1111', s)).toBeNull();
		expect(noteVersion('aaa1111', s)).toBeNull();
		expect(noteVersion('bbb2222', s)).toBe('aaa1111');
	});
	test('dev never reports', () => expect(noteVersion('dev', store())).toBeNull());
	test('ago', () => {
		const now = Date.parse('2026-11-06T12:00:00Z');
		expect(ago('2026-11-06T11:59:30Z', now)).toBe('just now');
		expect(ago('2026-11-06T11:57:00Z', now)).toBe('3 minutes ago');
		expect(ago('2026-11-05T12:00:00Z', now)).toBe('yesterday');
		expect(ago('nope', now)).toBe('');
	});
});
