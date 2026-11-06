// Intermediate representation of an inferred schema. Every emitter (OpenAPI, TypeScript, Zod, tree view) reads it.
// Built by infer.ts; nodes are plain objects so they can be used as identity keys (naming in names.ts).

export type Primitive = 'string' | 'integer' | 'number' | 'boolean' | 'null';

export type Property = { name: string; node: SchemaNode; required: boolean };

export type SchemaNode =
	| { kind: Primitive }
	/** Nothing known (items of an empty array). Neutral element of `merge`. */
	| { kind: 'any' }
	| { kind: 'array'; items: SchemaNode }
	/** Properties keep the order in which keys were first seen. */
	| { kind: 'object'; properties: Property[] }
	/** At most one variant per kind (objects and arrays are merged); never nested, never `any`, length ≥ 2. */
	| { kind: 'union'; variants: SchemaNode[] };

export type ObjectNode = Extract<SchemaNode, { kind: 'object' }>;
export type ArrayNode = Extract<SchemaNode, { kind: 'array' }>;
export type UnionNode = Extract<SchemaNode, { kind: 'union' }>;

export const isPrimitive = (n: SchemaNode): n is { kind: Primitive } =>
	n.kind === 'string' || n.kind === 'integer' || n.kind === 'number' || n.kind === 'boolean' || n.kind === 'null';

/** Variants of a node (a non-union node is its only variant). */
export const variantsOf = (n: SchemaNode): SchemaNode[] => (n.kind === 'union' ? n.variants : [n]);

/** True if `null` is one of the node's variants. */
export const isNullable = (n: SchemaNode) => variantsOf(n).some((v) => v.kind === 'null');

/** The node without its `null` variant (`null` alone stays `null`). */
export function withoutNull(n: SchemaNode): SchemaNode {
	if (n.kind !== 'union') return n;
	const rest = n.variants.filter((v) => v.kind !== 'null');
	return rest.length === 1 ? rest[0] : { kind: 'union', variants: rest };
}
