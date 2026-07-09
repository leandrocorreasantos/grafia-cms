import { NextRequest, NextResponse } from 'next/server';

function resolveApiBaseUrl(): string {
	return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

async function proxyPostsRequest(request: NextRequest, method: string) {
	const apiBaseUrl = resolveApiBaseUrl();
	const url = new URL(request.url);
	const upstreamUrl = `${apiBaseUrl}/api/posts${url.search}`;
	const headers = new Headers();

	const authorization = request.headers.get('authorization');
	if (authorization) {
		headers.set('authorization', authorization);
	}

	const contentType = request.headers.get('content-type');
	if (contentType) {
		headers.set('content-type', contentType);
	}

	let body: string | undefined;
	if (method !== 'GET' && method !== 'HEAD') {
		body = await request.text();
	}

	const upstreamResponse = await fetch(upstreamUrl, {
		method,
		headers,
		body,
		cache: 'no-store',
	});

	const responseBody = await upstreamResponse.text();

	return new NextResponse(responseBody, {
		status: upstreamResponse.status,
		headers: {
			'content-type': upstreamResponse.headers.get('content-type') || 'application/json',
		},
	});
}

export async function GET(request: NextRequest) {
	return proxyPostsRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
	return proxyPostsRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
	return proxyPostsRequest(request, 'PUT');
}

export async function DELETE(request: NextRequest) {
	return proxyPostsRequest(request, 'DELETE');
}

