// Theme per device (localStorage). "system" = no data-theme attribute: prefers-color-scheme decides (see app.css).
// The inline script in app.html applies the stored value before first paint (no flash).

export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_KEY = 'json2openapi.theme';
const ORDER: ThemeMode[] = ['light', 'dark', 'system'];
const META_COLOR = { light: '#f7f8fa', dark: '#0f1217' } as const;

export const theme = $state({ mode: 'system' as ThemeMode, resolved: 'dark' as 'light' | 'dark' });

function read(): ThemeMode {
	try {
		const v = localStorage.getItem(THEME_KEY);
		return v === 'light' || v === 'dark' ? v : 'system';
	} catch {
		return 'system';
	}
}

function resolve(mode: ThemeMode): 'light' | 'dark' {
	if (mode !== 'system') return mode;
	return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function apply(mode: ThemeMode) {
	const root = document.documentElement;
	if (mode === 'system') delete root.dataset.theme;
	else root.dataset.theme = mode;
	theme.resolved = resolve(mode);
	document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLOR[theme.resolved]);
}

let listening = false;

/** Syncs state with storage and follows system changes. */
export function initTheme() {
	theme.mode = read();
	apply(theme.mode);
	if (!listening) {
		listening = true;
		matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => theme.mode === 'system' && apply('system'));
	}
}

export function setTheme(mode: ThemeMode) {
	theme.mode = mode;
	try {
		if (mode === 'system') localStorage.removeItem(THEME_KEY);
		else localStorage.setItem(THEME_KEY, mode);
	} catch {
		/* not persisted */
	}
	apply(mode);
}

/** light → dark → system → light… */
export function cycleTheme() {
	setTheme(ORDER[(ORDER.indexOf(theme.mode) + 1) % ORDER.length]);
}
