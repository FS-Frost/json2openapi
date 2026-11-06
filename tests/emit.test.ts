import { describe, expect, test } from 'bun:test';
import { infer } from '#lib/infer/infer.ts';
import { nameSchemas, pascalCase } from '#lib/infer/names.ts';
import { toOpenApi } from '#lib/emit/openapi.ts';
import { toTypeScript } from '#lib/emit/typescript.ts';
import { toZod } from '#lib/emit/zod.ts';
import { toYamlText } from '#lib/emit/serialize.ts';
import { convert, downloadInfo } from '#lib/convert.ts';
import { DEFAULT_OPTIONS, normalizeOptions, type Options } from '#lib/options.ts';

const sample = { user_id: 1, name: 'a', eagles: [{ eagle_id: 1, pet_name: 'x' }], meta: {}, '2th': null };
const opts = (o: Partial<Options> = {}): Options => ({ ...DEFAULT_OPTIONS, ...o });

describe('pascalCase', () => {
	const cases: [string, string][] = [
		['user_id', 'UserId'],
		['petName', 'PetName'],
		['eagles', 'Eagles'],
		['2th', '_2th'],
		['--', 'Schema'],
		['HTTPStatus', 'HTTPStatus']
	];
	for (const [input, out] of cases) test(`${input} → ${out}`, () => expect(pascalCase(input)).toBe(out));
});

describe('nameSchemas', () => {
	test('root, array items with Item suffix, empty objects unnamed', () => {
		const { names, order } = nameSchemas(infer(sample), 'Root');
		expect(order.map((n) => names.get(n))).toEqual(['Root', 'EaglesItem']);
	});
	test('clashes get a numeric suffix', () => {
		const { names, order } = nameSchemas(infer({ root: { a: 1 } }), 'Root');
		expect(order.map((n) => names.get(n))).toEqual(['Root', 'Root2']);
	});
});

describe('OpenAPI', () => {
	test('refs: components with $ref', () => {
		const out = toOpenApi(infer(sample), opts({ refs: true }));
		expect(out).toEqual({
			components: {
				schemas: {
					Root: {
						type: 'object',
						properties: {
							user_id: { type: 'integer' },
							name: { type: 'string' },
							eagles: { type: 'array', items: { $ref: '#/components/schemas/EaglesItem' } },
							meta: { type: 'object' },
							'2th': { type: 'null' }
						},
						required: ['user_id', 'name', 'eagles', 'meta', '2th']
					},
					EaglesItem: {
						type: 'object',
						properties: { eagle_id: { type: 'integer' }, pet_name: { type: 'string' } },
						required: ['eagle_id', 'pet_name']
					}
				}
			}
		});
	});

	test('refs with a root array: the root gets its own component', () => {
		const out = toOpenApi(infer([{ a: 1 }]), opts({ refs: true }));
		expect(Object.keys((out.components as { schemas: object }).schemas)).toEqual(['Root', 'RootItem']);
	});

	test('nullable $ref → anyOf', () => {
		const out = toOpenApi(infer({ a: [{ b: 1 }, null] }), opts({ refs: true }));
		const root = (out.components as { schemas: Record<string, { properties: Record<string, unknown> }> }).schemas.Root;
		expect(root.properties.a).toEqual({
			type: 'array',
			items: { anyOf: [{ $ref: '#/components/schemas/AItem' }, { type: 'null' }] }
		});
	});

	test('full document as response', () => {
		const out = toOpenApi(infer({ a: 1 }), opts({ mode: 'document' }));
		expect(out).toEqual({
			openapi: '3.1.0',
			info: { title: 'My API', version: '1.0.0' },
			paths: {
				'/resource': {
					get: {
						responses: {
							'200': {
								description: 'OK',
								content: {
									'application/json': {
										schema: { type: 'object', properties: { a: { type: 'integer' } }, required: ['a'] }
									}
								}
							}
						}
					}
				}
			}
		});
	});

	test('full document as request body with refs', () => {
		const doc = { ...DEFAULT_OPTIONS.doc, method: 'post' as const, status: '201', placement: 'request' as const };
		const out = toOpenApi(infer({ a: 1 }), opts({ mode: 'document', refs: true, doc }));
		expect(out.paths).toEqual({
			'/resource': {
				post: {
					requestBody: {
						required: true,
						content: { 'application/json': { schema: { $ref: '#/components/schemas/Root' } } }
					},
					responses: { '201': { description: 'Created' } }
				}
			}
		});
		expect(out.components).toBeDefined();
	});

	test('YAML quotes numeric status keys', () => {
		const yaml = toYamlText(toOpenApi(infer({ a: 1 }), opts({ mode: 'document' })));
		expect(yaml).toContain('"200":');
		expect(yaml).toStartWith('openapi: 3.1.0');
	});
});

describe('TypeScript', () => {
	test('interfaces, optional and nullable', () => {
		const ts = toTypeScript(infer([{ id: 1, tags: ['a'], parent: null }, { id: 2.5, parent: { id: 1 } }]), 'Node');
		expect(ts).toBe(
			[
				'export type Node = NodeItem[];',
				'',
				'export interface NodeItem {',
				'  id: number;',
				'  tags?: string[];',
				'  parent: Parent | null;',
				'}',
				'',
				'export interface Parent {',
				'  id: number;',
				'}',
				''
			].join('\n')
		);
	});

	test('quoted keys, unknown items, empty object, array of union', () => {
		const ts = toTypeScript(infer({ 'a-b': [], m: {}, u: [1, 'x'] }), 'Root');
		expect(ts).toContain('"a-b": unknown[];');
		expect(ts).toContain('m: Record<string, unknown>;');
		expect(ts).toContain('u: (number | string)[];');
	});
});

describe('Zod', () => {
	test('dependencies first, int, optional, nullable', () => {
		const zod = toZod(infer([{ id: 1, child: { n: 1.5 } }, { id: 2, child: null, extra: 'x' }]), 'Root');
		expect(zod).toBe(
			[
				"import { z } from 'zod';",
				'',
				'export const Child = z.object({',
				'  n: z.number(),',
				'});',
				'export type Child = z.infer<typeof Child>;',
				'',
				'export const RootItem = z.object({',
				'  id: z.int(),',
				'  child: Child.nullable(),',
				'  extra: z.string().optional(),',
				'});',
				'export type RootItem = z.infer<typeof RootItem>;',
				'',
				'export const Root = z.array(RootItem);',
				'export type Root = z.infer<typeof Root>;',
				''
			].join('\n')
		);
	});

	test('union with null', () => {
		expect(toZod(infer([1, 'a', null]), 'Root')).toContain(
			'export const Root = z.array(z.union([z.int(), z.string()]).nullable());'
		);
	});
});

describe('convert + options', () => {
	test('convert produces every output', () => {
		const out = convert(sample, opts({ format: 'json' }));
		expect(JSON.parse(out.openapi).type).toBe('object');
		expect(out.typescript).toContain('export interface Root');
		expect(out.zod).toContain('export const Root');
		expect(out.tree.children.map((c) => c.name)).toEqual(['user_id', 'name', 'eagles', 'meta', '2th']);
	});

	test('download names follow tab and format', () => {
		expect(downloadInfo('openapi', opts()).name).toBe('Root.yaml');
		expect(downloadInfo('openapi', opts({ format: 'json', mode: 'document' })).name).toBe('openapi.json');
		expect(downloadInfo('zod', opts()).name).toBe('Root.zod.ts');
	});

	test('normalizeOptions repairs anything', () => {
		expect(normalizeOptions(null)).toEqual(DEFAULT_OPTIONS);
		expect(normalizeOptions('x')).toEqual(DEFAULT_OPTIONS);
		const o = normalizeOptions({ refs: 'yes', format: 'xml', tab: 'zod', doc: { path: 'users', status: '999', method: 'POST' } });
		expect(o.refs).toBe(false);
		expect(o.format).toBe('yaml');
		expect(o.tab).toBe('zod');
		expect(o.doc.path).toBe('/users');
		expect(o.doc.status).toBe('200');
		expect(o.doc.method).toBe('get');
	});
});
