// localStorage that never throws (private mode, blocked site data). Every key is prefixed `json2openapi.`.
export const PREFIX = 'json2openapi.';

export function readJson(key: string): unknown {
	try {
		const raw = localStorage.getItem(PREFIX + key);
		return raw == null ? null : JSON.parse(raw);
	} catch {
		return null;
	}
}

export function writeJson(key: string, value: unknown) {
	try {
		localStorage.setItem(PREFIX + key, JSON.stringify(value));
	} catch {
		/* full or blocked: the app keeps working without persistence */
	}
}

export function removeKey(key: string) {
	try {
		localStorage.removeItem(PREFIX + key);
	} catch {
		/* blocked */
	}
}
