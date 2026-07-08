import { NextResponse } from 'next/server';

export async function GET() {
	return NextResponse.json(
		{ error: 'Endpoint local desabilitado. Use a API externa configurada em NEXT_PUBLIC_API_URL.' },
		{ status: 501 },
	);
}

