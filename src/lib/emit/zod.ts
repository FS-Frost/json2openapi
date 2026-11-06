// IR → Zod 4 source code (text only: `zod` is not a dependency of this app).
// One `export const` per named object, dependencies first, each with its `z.infer` type.
import { isNullable, withoutNull, type ObjectNode, type SchemaNode } from '../infer/ir.ts';
import { dependencyOrder, nameSchemas, pascalCase, type Named } from '../infer/names.ts';
import { propKey, uniqueName } from './typescript.ts';

export function toZod(root: SchemaNode, rootName: string): string {
	const named = nameSchemas(root, rootName);
	const blocks = ["import { z } from 'zod';"];
	for (const n of dependencyOrder(named)) blocks.push(declare(named.names.get(n)!, objectOf(n, named)));
	if (root.kind !== 'object' || !named.names.has(root)) {
		blocks.push(declare(uniqueName(pascalCase(rootName), named), zodOf(root, named)));
	}
	return blocks.join('\n\n') + '\n';
}

const declare = (name: string, expr: string) =>
	`export const ${name} = ${expr};\nexport type ${name} = z.infer<typeof ${name}>;`;

function objectOf(node: ObjectNode, named: Named) {
	const lines = node.properties.map(
		(p) => `  ${propKey(p.name)}: ${zodOf(p.node, named)}${p.required ? '' : '.optional()'},`
	);
	return `z.object({\n${lines.join('\n')}\n})`;
}

function zodOf(node: SchemaNode, named: Named): string {
	switch (node.kind) {
		case 'any':
			return 'z.unknown()';
		case 'integer':
			return 'z.int()';
		case 'number':
			return 'z.number()';
		case 'string':
			return 'z.string()';
		case 'boolean':
			return 'z.boolean()';
		case 'null':
			return 'z.null()';
		case 'object':
			return named.names.get(node) ?? 'z.record(z.string(), z.unknown())';
		case 'array':
			return `z.array(${zodOf(node.items, named)})`;
		case 'union': {
			const base = withoutNull(node);
			const inner =
				base.kind === 'union' ? `z.union([${base.variants.map((v) => zodOf(v, named)).join(', ')}])` : zodOf(base, named);
			return isNullable(node) ? `${inner}.nullable()` : inner;
		}
	}
}
