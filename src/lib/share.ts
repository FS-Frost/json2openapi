// Share links without a server: input JSON + options, deflate-raw compressed (native CompressionStream), base64url,
// in the URL hash (`#s=…`; the hash never reaches GitHub Pages).
import { normalizeOptions, type Options } from './options.ts';

export type SharedState = { json: string; options: Options };

export const SHARE_PARAM = 's';
/** Beyond this, some chat apps and browsers truncate links: warn the user. */
export const SHARE_WARN_LENGTH = 32_000;
const FORMAT = 1;

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
	// `as`: TS 6 types Uint8Array as generic over ArrayBufferLike; Blob accepts any of them at runtime.
	const out = new Blob([bytes as Uint8Array<ArrayBuffer>]).stream().pipeThrough(stream);
	return new Uint8Array(await new Response(out).arrayBuffer());
}

export function toBase64Url(bytes: Uint8Array) {
	let bin = '';
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(s: string) {
	const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
	const bin = atob(b64);
	return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export async function encodeShare(state: SharedState): Promise<string> {
	const payload = JSON.stringify({ v: FORMAT, j: state.json, o: state.options });
	return toBase64Url(await pipe(new TextEncoder().encode(payload), new CompressionStream('deflate-raw')));
}

/** Null when the token is damaged or from an unknown format. */
export async function decodeShare(token: string): Promise<SharedState | null> {
	try {
		const bytes = await pipe(fromBase64Url(token), new DecompressionStream('deflate-raw'));
		const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
		if (typeof data !== 'object' || data === null) return null;
		const { v, j, o } = data as { v?: unknown; j?: unknown; o?: unknown }; // `as`: fields checked right below
		if (v !== FORMAT || typeof j !== 'string') return null;
		return { json: j, options: normalizeOptions(o) };
	} catch {
		return null;
	}
}

/** Token from a URL hash like `#s=abc` (null if absent). */
export function shareToken(hash: string): string | null {
	return new URLSearchParams(hash.replace(/^#/, '')).get(SHARE_PARAM);
}
