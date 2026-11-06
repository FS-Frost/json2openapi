// JSON.parse with a usable error location. Engines disagree (V8 gives a position, Firefox line/column, Safari nothing),
// so the location comes from `locateError`, a small strict validator that finds the first invalid character.
import type { Json } from './infer/infer.ts';

export type ParseError = { message: string; offset: number; line: number; column: number };
export type ParseResult = { ok: true; value: Json } | { ok: false; empty: boolean; error: ParseError | null };

export function parseJson(text: string): ParseResult {
	if (!text.trim()) return { ok: false, empty: true, error: null };
	try {
		// `as`: JSON.parse returns any; its output is JSON by definition.
		return { ok: true, value: JSON.parse(text) as Json };
	} catch (err) {
		const offset = locateError(text) ?? text.length;
		const { line, column } = lineColumn(text, offset);
		return { ok: false, empty: false, error: { message: cleanMessage(err), offset, line, column } };
	}
}

/** Engine message without its prefix or its own (inconsistent) position suffix. */
export function cleanMessage(err: unknown): string {
	const raw = err instanceof Error ? err.message : String(err);
	return (
		raw
			.replace(/^JSON(\.parse| Parse error)?:\s*/i, '')
			.replace(/\s*(in JSON )?at position \d+.*$/i, '')
			.replace(/\s*at line \d+ column \d+.*$/i, '')
			.trim() || 'Invalid JSON'
	);
}

/** 1-based line and column of a character offset. */
export function lineColumn(text: string, offset: number) {
	let line = 1;
	let start = 0;
	for (let i = 0; i < offset && i < text.length; i++) {
		if (text[i] === '\n') {
			line++;
			start = i + 1;
		}
	}
	return { line, column: offset - start + 1 };
}

/** Offset of the first character that makes `text` invalid JSON, or null if it is valid. */
export function locateError(text: string): number | null {
	let i = 0;
	const ws = () => {
		while (i < text.length && ' \t\n\r'.includes(text[i])) i++;
	};
	const fail = (): never => {
		throw i;
	};
	const literal = (word: string) => {
		for (const ch of word) {
			if (text[i] !== ch) fail();
			i++;
		}
	};
	const string = () => {
		i++; // opening quote
		while (i < text.length) {
			const c = text[i];
			if (c === '"') return void i++;
			if (c < ' ') fail();
			if (c === '\\') {
				i++;
				const e = text[i];
				if (e === 'u') {
					i++;
					for (let k = 0; k < 4; k++) {
						if (!/[0-9a-fA-F]/.test(text[i] ?? '')) fail();
						i++;
					}
				} else if (e !== undefined && '"\\/bfnrt'.includes(e)) i++;
				else fail();
			} else i++;
		}
		fail();
	};
	const number = () => {
		const m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i));
		if (!m) return fail();
		i += m[0].length;
	};
	const value = (): void => {
		ws();
		const c = text[i];
		if (c === '{') {
			i++;
			ws();
			if (text[i] === '}') return void i++;
			for (;;) {
				ws();
				if (text[i] !== '"') fail();
				string();
				ws();
				if (text[i] !== ':') fail();
				i++;
				value();
				ws();
				if (text[i] === ',') i++;
				else if (text[i] === '}') return void i++;
				else fail();
			}
		}
		if (c === '[') {
			i++;
			ws();
			if (text[i] === ']') return void i++;
			for (;;) {
				value();
				ws();
				if (text[i] === ',') i++;
				else if (text[i] === ']') return void i++;
				else fail();
			}
		}
		if (c === '"') return string();
		if (c === 't') return literal('true');
		if (c === 'f') return literal('false');
		if (c === 'n') return literal('null');
		if (c === '-' || (c >= '0' && c <= '9')) return number();
		fail();
	};
	try {
		value();
		ws();
		return i < text.length ? i : null;
	} catch (at) {
		return typeof at === 'number' ? Math.min(at, text.length) : null;
	}
}
