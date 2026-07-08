'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function EditPostPage() {
	const params = useParams<{ id: string }>();

	return (
		<main className="p-8 max-w-4xl mx-auto">
			<h1 className="text-3xl font-bold text-grafia-black mb-4">Editar Post</h1>
			<p className="text-gray-600 mb-6">
				Editor para o post <strong>{params.id}</strong> ainda nao implementado.
			</p>
			<Link
				href="/admin"
				className="inline-flex items-center bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
			>
				Voltar ao painel
			</Link>
		</main>
	);
}
