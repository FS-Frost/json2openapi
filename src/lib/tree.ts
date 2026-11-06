// IR → rows for the schema tree view (components/SchemaTree.svelte).
import { isNullable, withoutNull, type SchemaNode } from './infer/ir.ts';

export type TreeNode = {
	name: string;
	/** `string`, `integer | null`, `array<object>`, `object`… */
	type: string;
	required: boolean;
	nullable: boolean;
	children: TreeNode[];
};

export function typeLabel(node: SchemaNode): string {
	switch (node.kind) {
		case 'any':
			return 'any';
		case 'array':
			return `array<${typeLabel(node.items)}>`;
		case 'union':
			return node.variants.map(typeLabel).join(' | ');
		default:
			return node.kind;
	}
}

/** Children of a node: object properties; arrays show their items' children directly. */
function childrenOf(node: SchemaNode): TreeNode[] {
	const base = withoutNull(node);
	if (base.kind === 'object') return base.properties.map((p) => toTree(p.node, p.name, p.required));
	if (base.kind === 'array') return childrenOf(base.items);
	if (base.kind === 'union') return base.variants.flatMap(childrenOf);
	return [];
}

export function toTree(node: SchemaNode, name: string, required = true): TreeNode {
	return { name, type: typeLabel(node), required, nullable: isNullable(node), children: childrenOf(node) };
}

/** Number of properties at every depth (for the tree header). */
export const countNodes = (t: TreeNode): number => t.children.reduce((n, c) => n + 1 + countNodes(c), 0);
