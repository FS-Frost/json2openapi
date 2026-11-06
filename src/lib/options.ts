// Conversion and view options. Persisted per device (client/prefs.svelte.ts) and carried in share links (share.ts),
// so anything read from outside goes through `normalizeOptions`.

export const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;
export type Method = (typeof METHODS)[number];

export const TABS = ['openapi', 'typescript', 'zod', 'tree'] as const;
export type Tab = (typeof TABS)[number];

export type DocOptions = {
	title: string;
	version: string;
	method: Method;
	path: string;
	status: string;
	/** Where the sample goes: the response body or the request body. */
	placement: 'response' | 'request';
};

export type Options = {
	/** Name of the root schema (component, interface, Zod const). */
	rootName: string;
	/** Extract named objects to `components/schemas` and reference them with `$ref`. */
	refs: boolean;
	/** Bare schema or a complete OpenAPI document. */
	mode: 'schema' | 'document';
	format: 'json' | 'yaml';
	tab: Tab;
	doc: DocOptions;
};

export const DEFAULT_OPTIONS: Options = {
	rootName: 'Root',
	refs: false,
	mode: 'schema',
	format: 'yaml',
	tab: 'openapi',
	doc: { title: 'My API', version: '1.0.0', method: 'get', path: '/resource', status: '200', placement: 'response' }
};

type Raw = Record<string, unknown>;

const isRecord = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback: string, max = 200) =>
	typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : fallback;
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
	allowed.includes(v as T) ? (v as T) : fallback; // `as`: checked by `includes` on the same line

/** Valid options from anything (stored prefs, a share link); unknown or invalid fields take the default. */
export function normalizeOptions(raw: unknown): Options {
	const r = isRecord(raw) ? raw : {};
	const d = isRecord(r.doc) ? r.doc : {};
	const D = DEFAULT_OPTIONS;
	const path = str(d.path, D.doc.path);
	const status = str(d.status, D.doc.status, 3);
	return {
		rootName: str(r.rootName, D.rootName, 80),
		refs: typeof r.refs === 'boolean' ? r.refs : D.refs,
		mode: oneOf(r.mode, ['schema', 'document'] as const, D.mode),
		format: oneOf(r.format, ['json', 'yaml'] as const, D.format),
		tab: oneOf(r.tab, TABS, D.tab),
		doc: {
			title: str(d.title, D.doc.title),
			version: str(d.version, D.doc.version, 40),
			method: oneOf(d.method, METHODS, D.doc.method),
			path: path.startsWith('/') ? path : `/${path}`,
			status: /^[1-5]\d\d$/.test(status) ? status : D.doc.status,
			placement: oneOf(d.placement, ['response', 'request'] as const, D.doc.placement)
		}
	};
}
