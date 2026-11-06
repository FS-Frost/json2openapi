// IR → OpenAPI 3.1 (JSON Schema 2020-12). Nullability uses type arrays (`type: [string, "null"]`), never `nullable`.
import { isPrimitive, type ObjectNode, type SchemaNode } from '../infer/ir.ts';
import { nameSchemas, pascalCase, type Named } from '../infer/names.ts';
import type { Options } from '../options.ts';

export type JsonSchema = { [key: string]: unknown };

const REF = '#/components/schemas/';

export const OPENAPI_VERSION = '3.1.0';

export function toOpenApi(root: SchemaNode, opts: Pick<Options, 'refs' | 'rootName' | 'mode' | 'doc'>): JsonSchema {
	const named = opts.refs ? nameSchemas(root, opts.rootName) : null;
	let schema = emit(root, named);
	let components: { schemas: Record<string, JsonSchema> } | undefined;
	if (named?.order.length) {
		const schemas: Record<string, JsonSchema> = {};
		// A root that is not a named object (an array, a union…) still gets its own component, first.
		if (root.kind !== 'object' || !named.names.has(root)) {
			const name = uniqueRootName(opts.rootName, named);
			schemas[name] = schema;
			schema = { $ref: REF + name };
		}
		for (const n of named.order) schemas[named.names.get(n)!] = emitObject(n, named);
		components = { schemas };
	}

	if (opts.mode === 'schema') return components ? { components } : schema;

	const d = opts.doc;
	const content = { 'application/json': { schema } };
	const operation: JsonSchema =
		d.placement === 'request'
			? { requestBody: { required: true, content }, responses: { [d.status]: { description: describe(d.status) } } }
			: { responses: { [d.status]: { description: describe(d.status), content } } };
	return {
		openapi: OPENAPI_VERSION,
		info: { title: d.title, version: d.version },
		paths: { [d.path]: { [d.method]: operation } },
		...(components ? { components } : {})
	};
}

const STATUS_TEXT: Record<string, string> = {
	'200': 'OK',
	'201': 'Created',
	'202': 'Accepted',
	'204': 'No Content',
	'400': 'Bad Request',
	'401': 'Unauthorized',
	'403': 'Forbidden',
	'404': 'Not Found',
	'409': 'Conflict',
	'422': 'Unprocessable Entity',
	'500': 'Internal Server Error'
};
const describe = (status: string) => STATUS_TEXT[status] ?? 'Response';

function uniqueRootName(rootName: string, named: Named) {
	const used = new Set(named.names.values());
	const base = pascalCase(rootName);
	let name = base;
	for (let i = 2; used.has(name); i++) name = `${base}${i}`;
	return name;
}

function emit(node: SchemaNode, named: Named | null): JsonSchema {
	switch (node.kind) {
		case 'any':
			return {};
		case 'array':
			return { type: 'array', items: emit(node.items, named) };
		case 'object': {
			const name = named?.names.get(node);
			if (name) return { $ref: REF + name };
			return emitObject(node, named);
		}
		case 'union':
			return emitUnion(node.variants, named);
		default:
			return { type: node.kind };
	}
}

function emitObject(node: ObjectNode, named: Named | null): JsonSchema {
	if (node.properties.length === 0) return { type: 'object' };
	const required = node.properties.filter((p) => p.required).map((p) => p.name);
	return {
		type: 'object',
		properties: Object.fromEntries(node.properties.map((p) => [p.name, emit(p.node, named)])),
		...(required.length ? { required } : {})
	};
}

/**
 * Primitives (and at most one inline object or array) collapse into a type array: `{type: [object, "null"], …}`.
 * Two structured variants, or a $ref, need `anyOf`.
 */
function emitUnion(variants: SchemaNode[], named: Named | null): JsonSchema {
	const structured = variants.filter((v) => !isPrimitive(v));
	const primitives = variants.filter(isPrimitive).map((v) => v.kind);
	if (structured.length === 0) return { type: primitives };
	if (structured.length === 1) {
		const body = emit(structured[0], named);
		if (typeof body.type === 'string') return { ...body, type: [body.type, ...primitives] };
	}
	return { anyOf: variants.map((v) => emit(v, named)) };
}
