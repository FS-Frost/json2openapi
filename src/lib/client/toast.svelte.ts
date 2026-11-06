// App notifications (toasts), top-center. For action confirmations, notices and transient errors:
//   toast.success('Copied')                         // closes itself (2.5 s)
//   toast.error('Could not read the file', { detail }) // stays until closed
// The editor parse error is shown inline (it belongs to the input), not as a toast.
// Rendered by components/Toaster.svelte (mounted once in the root layout). Ported from sensei.

import { untrack } from 'svelte';

export type ToastKind = 'success' | 'info' | 'warn' | 'error';

export type ToastAction = { label: string; run: () => void | Promise<void>; /** Keep the toast open after running. */ keep?: boolean };

export type ToastOptions = {
	/** Second, smaller line. */
	detail?: string;
	/** ms until it closes; null = until closed by hand. Default per kind (DURATIONS). */
	duration?: number | null;
	/** Up to two buttons. */
	actions?: ToastAction[];
	/** A new toast with the same key replaces the previous one. */
	key?: string;
	/** No close button (for notices that resolve through an action). */
	persistent?: boolean;
};

export type Toast = Required<Pick<ToastOptions, 'duration'>> &
	Omit<ToastOptions, 'duration'> & { id: number; kind: ToastKind; message: string; createdAt: number };

export const DURATIONS: Record<ToastKind, number | null> = { success: 2500, info: 5000, warn: 8000, error: null };
export const MAX_TOASTS = 4;

export const toasts = $state<{ list: Toast[] }>({ list: [] });

let nextId = 1;
const timers = new Map<number, { handle: ReturnType<typeof setTimeout>; ends: number; left: number }>();

function schedule(t: Toast, ms: number) {
	clearTimeout(timers.get(t.id)?.handle);
	timers.set(t.id, { handle: setTimeout(() => dismiss(t.id), ms), ends: Date.now() + ms, left: ms });
}

export function show(kind: ToastKind, message: string, opts: ToastOptions = {}): number {
	// Untracked: when called from an $effect, reading the list would re-trigger it in a loop.
	return untrack(() => {
		const duration = opts.duration === undefined ? DURATIONS[kind] : opts.duration;
		if (opts.key) for (const old of toasts.list.filter((x) => x.key === opts.key)) dismiss(old.id);
		const t: Toast = { ...opts, id: nextId++, kind, message, duration, createdAt: Date.now() };
		toasts.list = [...toasts.list, t].slice(-MAX_TOASTS);
		if (duration != null) schedule(t, duration);
		return t.id;
	});
}

export function dismiss(id: number) {
	clearTimeout(timers.get(id)?.handle);
	timers.delete(id);
	toasts.list = toasts.list.filter((t) => t.id !== id);
}

/** Pauses auto-close (pointer or focus over it) and resumes with the remaining time. */
export function pause(id: number) {
	const tm = timers.get(id);
	if (!tm) return;
	clearTimeout(tm.handle);
	timers.set(id, { ...tm, left: Math.max(0, tm.ends - Date.now()) });
}
export function resume(id: number) {
	const tm = timers.get(id);
	const t = toasts.list.find((x) => x.id === id);
	if (tm && t) schedule(t, Math.max(1200, tm.left));
}

export const toast = Object.assign((message: string, opts?: ToastOptions) => show('info', message, opts), {
	success: (message: string, opts?: ToastOptions) => show('success', message, opts),
	info: (message: string, opts?: ToastOptions) => show('info', message, opts),
	warn: (message: string, opts?: ToastOptions) => show('warn', message, opts),
	error: (message: string, opts?: ToastOptions) => show('error', message, opts),
	dismiss
});
