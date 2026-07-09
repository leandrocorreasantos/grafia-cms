'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function EditPostPage() {
	const params = useParams<{ id: string }>();

	return (
		<div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
			<section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_60px_rgba(31,27,22,0.06)] lg:p-8">
				<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8c6b22]">Conteúdo</p>
				<h1 className="mt-3 text-3xl font-semibold text-grafia-black">Editar post</h1>
				<p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
					Editor para o post <strong>{params.id}</strong> ainda não está implementado, mas o espaço já está preparado para receber o editor rico.
				</p>

				<div className="mt-8 min-h-[28rem] rounded-[1.75rem] border border-dashed border-black/12 bg-[#fcfbf7] p-6">
					<p className="text-sm font-medium text-neutral-500">Área do editor</p>
					<div className="mt-4 h-[20rem] rounded-[1.5rem] border border-black/10 bg-white shadow-inner" />
				</div>

				<div className="mt-6 flex flex-wrap gap-3">
					<Link
						href="/admin"
						className="inline-flex items-center rounded-2xl border border-black/10 bg-white px-5 py-3 font-semibold text-grafia-black transition hover:bg-[#f8f5ef]"
					>
						Voltar ao painel
					</Link>
				</div>
			</section>

			<aside className="space-y-4">
				<div className="rounded-[2rem] border border-black/8 bg-[#1f1b16] p-6 text-white shadow-[0_18px_60px_rgba(31,27,22,0.1)]">
					<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">Fluxo editorial</p>
					<h2 className="mt-3 text-xl font-semibold">Estrutura pronta</h2>
					<p className="mt-3 text-sm leading-6 text-white/72">
						O layout já acomoda toolbar, metadados e caixas laterais quando o editor visual for conectado.
					</p>
				</div>

				<div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_60px_rgba(31,27,22,0.06)]">
					<h3 className="text-base font-semibold text-grafia-black">Metadados futuros</h3>
					<ul className="mt-4 space-y-3 text-sm text-neutral-600">
						<li>• Status e publicação</li>
						<li>• Categorias e tags</li>
						<li>• Excerpt e slug</li>
						<li>• Revisão e histórico</li>
					</ul>
				</div>
			</aside>
		</div>
	);
}
