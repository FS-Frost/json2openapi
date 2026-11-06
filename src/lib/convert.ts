// One parsed sample → every output the UI shows. Pure, so the page only deals with state.
import { toOpenApi } from './emit/openapi.ts';
import { toJsonText, toYamlText } from './emit/serialize.ts';
import { toTypeScript } from './emit/typescript.ts';
import { toZod } from './emit/zod.ts';
import { infer, type Json } from './infer/infer.ts';
import type { Options } from './options.ts';
import { toTree, type TreeNode } from './tree.ts';

export type Outputs = { openapi: string; typescript: string; zod: string; tree: TreeNode };

export function convert(value: Json, opts: Options): Outputs {
	const root = infer(value);
	const spec = toOpenApi(root, opts);
	return {
		openapi: opts.format === 'yaml' ? toYamlText(spec) : toJsonText(spec),
		typescript: toTypeScript(root, opts.rootName),
		zod: toZod(root, opts.rootName),
		tree: toTree(root, opts.rootName)
	};
}

/** File name and MIME type for downloading the output of a tab. */
export function downloadInfo(tab: 'openapi' | 'typescript' | 'zod', opts: Options) {
	const base = opts.mode === 'document' ? 'openapi' : opts.rootName.replace(/[^\w.-]+/g, '_') || 'schema';
	if (tab === 'typescript') return { name: `${base}.ts`, type: 'text/typescript' };
	if (tab === 'zod') return { name: `${base}.zod.ts`, type: 'text/typescript' };
	return opts.format === 'yaml'
		? { name: `${base}.yaml`, type: 'application/yaml' }
		: { name: `${base}.json`, type: 'application/json' };
}
