'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearToken, getToken, isAuthenticated, setToken } from '@/lib/auth';

interface LoginInput {
	email: string;
	password: string;
	appName?: string;
}

interface LoginResponse {
	token: string;
	type: 'user' | 'application';
}

export function useAuth() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [token, setCurrentToken] = useState<string | null>(null);

	useEffect(() => {
		setCurrentToken(getToken());
		setLoading(false);
	}, []);

	const authenticated = useMemo(() => !!token, [token]);

	const login = async (input: LoginInput) => {
		const response = await fetch('/api/session/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(input),
		});

		const data = (await response.json().catch(() => ({}))) as Partial<LoginResponse> & {
			error?: string;
		};

		if (!response.ok || !data.token || !data.type) {
			throw new Error(data.error || 'Falha ao autenticar');
		}

		setToken(data.token);
		setCurrentToken(data.token);
		return {
			token: data.token,
			type: data.type,
		};
	};

	const logout = async () => {
		await fetch('/api/session/logout', {
			method: 'POST',
		});
		clearToken();
		setCurrentToken(null);
		router.push('/login');
	};

	return {
		loading,
		token,
		authenticated,
		login,
		logout,
		isAuthenticated: isAuthenticated(),
	};
}
