// JSON value → schema IR (ir.ts).
// Rules: integer vs number; arrays merge ALL their items; a key is required when present in every merged object;
// integer + number → number; different kinds → union (null included, which makes the node nullable).
import type { ObjectNode, Property, SchemaNode } from './ir.ts';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export function infer(value: Json): SchemaNode {
	if (value === null) return { kind: 'null' };
	switch (typeof value) {
		case 'boolean':
			return { kind: 'boolean' };
		case 'number':
			return { kind: Number.isInteger(value) ? 'integer' : 'number' };
		case 'string':
			return { kind: 'string' };
	}
	if (Array.isArray(value)) {
		return { kind: 'array', items: value.map(infer).reduce<SchemaNode>(merge, { kind: 'any' }) };
	}
	return {
		kind: 'object',
		properties: Object.entries(value).map(([name, v]) => ({ name, node: infer(v), required: true }))
	};
}

/** Least general schema that accepts what `a` and `b` accept. */
export function merge(a: SchemaNode, b: SchemaNode): SchemaNode {
	if (a.kind === 'any') return b;
	if (b.kind === 'any') return a;
	let acc = a.kind === 'union' ? [...a.variants] : [a];
	for (const v of b.kind === 'union' ? b.variants : [b]) acc = addVariant(acc, v);
	return fromVariants(acc);
}

function addVariant(list: SchemaNode[], v: SchemaNode): SchemaNode[] {
	// integer ⊂ number
	if (v.kind === 'integer' && list.some((x) => x.kind === 'number')) return list;
	if (v.kind === 'number') list = list.map((x) => (x.kind === 'integer' ? v : x));
	const i = list.findIndex((x) => x.kind === v.kind);
	if (i < 0) return [...list, v];
	const cur = list[i];
	let merged: SchemaNode = cur;
	if (cur.kind === 'object' && v.kind === 'object') merged = mergeObjects(cur, v);
	else if (cur.kind === 'array' && v.kind === 'array') merged = { kind: 'array', items: merge(cur.items, v.items) };
	return list.map((x, j) => (j === i ? merged : x));
}

function mergeObjects(a: ObjectNode, b: ObjectNode): ObjectNode {
	const inB = new Map(b.properties.map((p) => [p.name, p]));
	const props: Property[] = a.properties.map((p) => {
		const q = inB.get(p.name);
		return q
			? { name: p.name, node: merge(p.node, q.node), required: p.required && q.required }
			: { ...p, required: false };
	});
	const inA = new Set(a.properties.map((p) => p.name));
	for (const q of b.properties) if (!inA.has(q.name)) props.push({ ...q, required: false });
	return { kind: 'object', properties: props };
}

/** Deduplicated variants (integer and number already merged); null always last. */
function fromVariants(list: SchemaNode[]): SchemaNode {
	const sorted = [...list.filter((v) => v.kind !== 'null'), ...list.filter((v) => v.kind === 'null')];
	return sorted.length === 1 ? sorted[0] : { kind: 'union', variants: sorted };
}
