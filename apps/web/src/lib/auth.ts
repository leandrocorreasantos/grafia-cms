const TOKEN_KEY = 'grafia_token';

function isBrowser(): boolean {
	return typeof window !== 'undefined';
}

export function getToken(): string | null {
	if (!isBrowser()) return null;
	return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
	if (!isBrowser()) return;

	window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
	if (!isBrowser()) return;

	window.localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
	return !!getToken();
}
