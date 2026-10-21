/** expo-secure-store has no synchronous browser implementation: the web build keeps these values in its local storage. */
export function getItem(key: string): string | null {
	return window.localStorage.getItem(key);
}

export function setItem(key: string, value: string): void {
	window.localStorage.setItem(key, value);
}
