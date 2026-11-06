// IR → TypeScript declarations: one `export interface` per named object, root first.
// integer → number; missing-in-some-samples → optional `?`; null variant → `| null`; unknown items → `unknown`.
import type { ObjectNode, SchemaNode } from '../infer/ir.ts';
import { nameSchemas, pascalCase, type Named } from '../infer/names.ts';

const IDENT = /^[A-Za-z_$][\w$]*$/;
export const propKey = (name: string) => (IDENT.test(name) ? name : JSON.stringify(name));

export function toTypeScript(root: SchemaNode, rootName: string): string {
	const named = nameSchemas(root, rootName);
	const blocks: string[] = [];
	if (root.kind !== 'object' || !named.names.has(root)) {
		blocks.push(`export type ${uniqueName(pascalCase(rootName), named)} = ${typeOf(root, named)};`);
	}
	for (const n of named.order) blocks.push(interfaceOf(named.names.get(n)!, n, named));
	return blocks.join('\n\n') + '\n';
}

export function uniqueName(base: string, named: Named) {
	const used = new Set(named.names.values());
	let name = base;
	for (let i = 2; used.has(name); i++) name = `${base}${i}`;
	return name;
}

function interfaceOf(name: string, node: ObjectNode, named: Named) {
	const lines = node.properties.map((p) => `  ${propKey(p.name)}${p.required ? '' : '?'}: ${typeOf(p.node, named)};`);
	return `export interface ${name} {\n${lines.join('\n')}\n}`;
}

function typeOf(node: SchemaNode, named: Named): string {
	switch (node.kind) {
		case 'any':
			return 'unknown';
		case 'integer':
		case 'number':
			return 'number';
		case 'string':
		case 'boolean':
		case 'null':
			return node.kind;
		case 'object':
			return named.names.get(node) ?? 'Record<string, unknown>';
		case 'array': {
			const inner = typeOf(node.items, named);
			return node.items.kind === 'union' ? `(${inner})[]` : `${inner}[]`;
		}
		case 'union':
			return node.variants.map((v) => typeOf(v, named)).join(' | ');
	}
}
