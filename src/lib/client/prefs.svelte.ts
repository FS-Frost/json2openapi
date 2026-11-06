// Options persisted per device. Mutate `prefs.options` (deeply reactive); `savePrefs()` writes it back.
import { normalizeOptions, type Options } from '../options.ts';
import { readJson, writeJson } from './storage.ts';

const KEY = 'prefs';

export const prefs = $state<{ options: Options }>({ options: normalizeOptions(null) });

export function loadPrefs() {
	prefs.options = normalizeOptions(readJson(KEY));
}

export function savePrefs() {
	writeJson(KEY, $state.snapshot(prefs.options));
}
