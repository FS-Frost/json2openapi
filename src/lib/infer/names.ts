// Names for the object nodes that become standalone schemas ($ref components, TS interfaces, Zod consts).
// Root object → rootName; property `foo_bar` → `FooBar`; array items → parent name + `Item`; clashes → numeric suffix.
// Objects without properties are never named (emitters inline them).
import type { ObjectNode, SchemaNode } from './ir.ts';

export type Named = {
	/** Name of each named object node. */
	names: Map<ObjectNode, string>;
	/** Named nodes, parents before children (root first). */
	order: ObjectNode[];
};

/** `user_id` → `UserId`, `petName` → `PetName`, `2th` → `_2th`; empty → `Schema`. */
export function pascalCase(key: string): string {
	const words = key
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.split(/[^A-Za-z0-9]+/)
		.filter(Boolean);
	const name = words.map((w) => w[0].toUpperCase() + w.slice(1)).join('');
	if (!name) return 'Schema';
	return /^[0-9]/.test(name) ? `_${name}` : name;
}

export function nameSchemas(root: SchemaNode, rootName: string): Named {
	const names = new Map<ObjectNode, string>();
	const order: ObjectNode[] = [];
	const used = new Set<string>();

	const unique = (base: string) => {
		let name = base;
		for (let i = 2; used.has(name); i++) name = `${base}${i}`;
		used.add(name);
		return name;
	};

	const visit = (node: SchemaNode, suggested: string) => {
		switch (node.kind) {
			case 'object':
				if (node.properties.length === 0 || names.has(node)) return;
				names.set(node, unique(suggested));
				order.push(node);
				for (const p of node.properties) visit(p.node, pascalCase(p.name));
				return;
			case 'array':
				visit(node.items, `${suggested}Item`);
				return;
			case 'union':
				for (const v of node.variants) visit(v, suggested);
				return;
		}
	};

	visit(root, pascalCase(rootName));
	return { names, order };
}

/** Named nodes with every dependency before its dependents (for languages that need declaration order). */
export function dependencyOrder(named: Named): ObjectNode[] {
	const out: ObjectNode[] = [];
	const done = new Set<ObjectNode>();
	const walk = (node: SchemaNode) => {
		if (node.kind === 'array') return walk(node.items);
		if (node.kind === 'union') return node.variants.forEach(walk);
		if (node.kind !== 'object' || done.has(node)) return;
		done.add(node);
		for (const p of node.properties) walk(p.node);
		if (named.names.has(node)) out.push(node);
	};
	named.order.forEach(walk);
	return out;
}
