import { describe, expect, test } from 'bun:test';
import { infer, merge, type Json } from '#lib/infer/infer.ts';
import { toOpenApi, type JsonSchema } from '#lib/emit/openapi.ts';
import { DEFAULT_OPTIONS } from '#lib/options.ts';
import example from '#lib/example.json';

const schema = (value: Json) => toOpenApi(infer(value), DEFAULT_OPTIONS);

describe('infer → OpenAPI 3.1 schema', () => {
	const cases: [string, Json, JsonSchema][] = [
		['string', 'a', { type: 'string' }],
		['integer', 3, { type: 'integer' }],
		['number (never "float")', 1.5, { type: 'number' }],
		['boolean', false, { type: 'boolean' }],
		['null alone', null, { type: 'null' }],
		['empty object', {}, { type: 'object' }],
		['empty array', [], { type: 'array', items: {} }],
		['root array of integers', [1, 2], { type: 'array', items: { type: 'integer' } }],
		['integer + number → number', [1, 2.5], { type: 'array', items: { type: 'number' } }],
		['mixed primitives → type array', [1, 'a'], { type: 'array', items: { type: ['integer', 'string'] } }],
		['nullable primitive, null last', [null, 'a'], { type: 'array', items: { type: ['string', 'null'] } }],
		[
			'object keys required',
			{ a: 1, b: null },
			{ type: 'object', properties: { a: { type: 'integer' }, b: { type: 'null' } }, required: ['a', 'b'] }
		],
		[
			'array items merged: union of keys, required = present in all',
			[{ a: 1, b: 'x' }, { a: 2 }, { a: 3, c: true }],
			{
				type: 'array',
				items: {
					type: 'object',
					properties: { a: { type: 'integer' }, b: { type: 'string' }, c: { type: 'boolean' } },
					required: ['a']
				}
			}
		],
		[
			'nullable object keeps its keywords',
			[{ a: 1 }, null],
			{
				type: 'array',
				items: { type: ['object', 'null'], properties: { a: { type: 'integer' } }, required: ['a'] }
			}
		],
		[
			'object + array → anyOf',
			[{ a: 1 }, [1]],
			{
				type: 'array',
				items: {
					anyOf: [
						{ type: 'object', properties: { a: { type: 'integer' } }, required: ['a'] },
						{ type: 'array', items: { type: 'integer' } }
					]
				}
			}
		],
		[
			'empty array merges with a filled one',
			[[], ['x']],
			{ type: 'array', items: { type: 'array', items: { type: 'string' } } }
		],
		[
			'nested property types merge',
			[{ a: 1 }, { a: null }],
			{
				type: 'array',
				items: { type: 'object', properties: { a: { type: ['integer', 'null'] } }, required: ['a'] }
			}
		]
	];
	for (const [name, input, expected] of cases) test(name, () => expect(schema(input)).toEqual(expected));
});

describe('merge', () => {
	test('is commutative for integer/number', () => {
		expect(merge({ kind: 'number' }, { kind: 'integer' })).toEqual({ kind: 'number' });
		expect(merge({ kind: 'integer' }, { kind: 'number' })).toEqual({ kind: 'number' });
	});
	test('any is neutral', () => {
		expect(merge({ kind: 'any' }, { kind: 'string' })).toEqual({ kind: 'string' });
		expect(merge({ kind: 'string' }, { kind: 'any' })).toEqual({ kind: 'string' });
	});
});

test('the bundled example converts without float or empty types', () => {
	// `as`: a JSON import is JSON, but TS infers its literal shape instead of `Json`.
	const text = JSON.stringify(schema(example as Json));
	expect(text).not.toContain('float');
	expect(text).not.toContain('"type":""');
	expect(text).toContain('"enemies":{"type":"null"}');
});
