// Recent conversions in localStorage (logic in lib/history.ts).
import { addToHistory, normalizeHistory, type HistoryEntry } from '../history.ts';
import type { Json } from '../infer/infer.ts';
import { readJson, removeKey, writeJson } from './storage.ts';

const KEY = 'history';

export const history = $state<{ list: HistoryEntry[] }>({ list: [] });

export function loadHistory() {
	history.list = normalizeHistory(readJson(KEY));
}

export function remember(json: string, value: Json) {
	history.list = addToHistory(history.list, json, value);
	writeJson(KEY, history.list);
}

export function forget(id: string) {
	history.list = history.list.filter((e) => e.id !== id);
	writeJson(KEY, history.list);
}

export function clearHistory() {
	history.list = [];
	removeKey(KEY);
}
