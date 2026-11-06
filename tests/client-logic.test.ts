import { describe, expect, test } from 'bun:test';
import { cleanMessage, lineColumn, locateError, parseJson } from '#lib/parse.ts';
import { decodeShare, encodeShare, fromBase64Url, shareToken, toBase64Url } from '#lib/share.ts';
import { addToHistory, hashText, HISTORY_MAX, labelFor, normalizeHistory } from '#lib/history.ts';
import { countNodes, toTree } from '#lib/tree.ts';
import { infer } from '#lib/infer/infer.ts';
import { DEFAULT_OPTIONS } from '#lib/options.ts';

describe('parseJson', () => {
	test('valid', () => expect(parseJson('{"a":1}')).toEqual({ ok: true, value: { a: 1 } }));
	test('empty input is not an error', () => expect(parseJson('  \n')).toEqual({ ok: false, empty: true, error: null }));
	test('error has line and column', () => {
		const r = parseJson('{\n  "a": 1,\n  "b": }');
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error).toMatchObject({ line: 3, column: 8 });
	});
});

describe('locateError', () => {
	const cases: [string, number | null][] = [
		['{"a":1}', null],
		['[1, 2, 3]', null],
		['"\\u00e9"', null],
		['-0.5e10', null],
		['{"a":1,}', 7],
		['[1 2]', 3],
		['{a:1}', 1],
		['tru', 3],
		['01', 1],
		['"\\x"', 2],
		['"abc', 4],
		['{"a":1} x', 8],
		['', 0],
		['-', 0]
	];
	for (const [text, at] of cases) test(JSON.stringify(text), () => expect(locateError(text)).toBe(at));
});

test('lineColumn', () => {
	expect(lineColumn('ab\ncd', 4)).toEqual({ line: 2, column: 2 });
	expect(lineColumn('ab', 0)).toEqual({ line: 1, column: 1 });
});

test('cleanMessage drops engine prefixes and positions', () => {
	expect(cleanMessage(new SyntaxError('JSON Parse error: Unexpected identifier "x"'))).toBe('Unexpected identifier "x"');
	expect(cleanMessage(new SyntaxError("Expected property name or '}' in JSON at position 1 (line 1 column 2)"))).toBe(
		"Expected property name or '}'"
	);
	expect(cleanMessage(new SyntaxError('JSON.parse: expected property name at line 1 column 2 of the JSON data'))).toBe(
		'expected property name'
	);
});

describe('share', () => {
	test('round trip', async () => {
		const state = { json: '{"a": "ñandú 🦤"}', options: { ...DEFAULT_OPTIONS, refs: true, tab: 'zod' as const } };
		const token = await encodeShare(state);
		expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
		expect(await decodeShare(token)).toEqual(state);
	});
	test('damaged token → null', async () => expect(await decodeShare('not-a-token')).toBeNull());
	test('base64url round trip', () => {
		const bytes = Uint8Array.from([0, 251, 255, 62, 63]);
		expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes);
	});
	test('shareToken reads the hash', () => {
		expect(shareToken('#s=abc')).toBe('abc');
		expect(shareToken('')).toBeNull();
	});
});

describe('history', () => {
	test('labels', () => {
		expect(labelFor({ a: 1, b: 2, c: 3, d: 4 })).toBe('{ a, b, c, … }');
		expect(labelFor([1])).toBe('[1 item]');
		expect(labelFor({})).toBe('{ }');
		expect(labelFor('x')).toBe('"x"');
	});
	test('dedupes ignoring whitespace, newest first, capped', () => {
		let list = addToHistory([], '{"a":1}', { a: 1 }, 1);
		list = addToHistory(list, '{"b":1}', { b: 1 }, 2);
		list = addToHistory(list, '{ "a": 1 }', { a: 1 }, 3);
		expect(list.map((e) => e.at)).toEqual([3, 2]);
		for (let i = 0; i < 30; i++) list = addToHistory(list, `[${i}]`, [i], 10 + i);
		expect(list).toHaveLength(HISTORY_MAX);
	});
	test('hash is stable', () => expect(hashText('abc')).toBe(hashText('abc')));
	test('normalize drops junk', () => {
		expect(normalizeHistory([{ id: 'x', json: '{}', label: '{ }', at: 1 }, { id: 1 }, null])).toHaveLength(1);
		expect(normalizeHistory('x')).toEqual([]);
	});
});

test('tree', () => {
	const t = toTree(infer({ a: [{ b: 1 }, { b: null, c: 'x' }] }), 'Root');
	expect(t.children[0]).toMatchObject({ name: 'a', type: 'array<object>' });
	expect(t.children[0].children.map((c) => [c.name, c.type, c.required, c.nullable])).toEqual([
		['b', 'integer | null', true, true],
		['c', 'string', false, false]
	]);
	expect(countNodes(t)).toBe(3);
});
