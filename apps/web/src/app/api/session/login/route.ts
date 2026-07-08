import { NextResponse } from 'next/server';

const TOKEN_COOKIE = 'grafia_token';
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

interface LoginRequestBody {
  email: string;
  password: string;
  appName?: string;
}

function resolveApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

export async function POST(request: Request) {
  let body: LoginRequestBody;

  try {
    body = (await request.json()) as LoginRequestBody;
  } catch {
    return NextResponse.json({ error: 'Payload de login invalido' }, { status: 400 });
  }

  const apiBaseUrl = resolveApiBaseUrl();
  const upstreamResponse = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const upstreamData = await upstreamResponse.json().catch(() => ({}));

  if (!upstreamResponse.ok || !upstreamData?.token) {
    return NextResponse.json(
      { error: upstreamData?.error || 'Falha ao autenticar usuario' },
      { status: upstreamResponse.status || 401 },
    );
  }

  const response = NextResponse.json(
    {
      token: upstreamData.token,
      type: upstreamData.type,
      user: upstreamData.user,
    },
    { status: 200 },
  );

  response.cookies.set({
    name: TOKEN_COOKIE,
    value: upstreamData.token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
