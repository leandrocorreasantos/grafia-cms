'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function NewPost() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/api/posts', {
                title,
                content,
                authorId: 'admin-user-id' // TODO: Pegar do auth
            });
            router.push('/admin');
        } catch (error) {
            alert('Erro ao criar post');
        } finally {
            setLoading(false);
        }
    };

    return (
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_60px_rgba(31,27,22,0.06)] lg:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8c6b22]">Conteúdo</p>
                    <h1 className="mt-3 text-3xl font-semibold text-grafia-black">Novo post</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
                        Estrutura preparada para receber um editor de texto rico no futuro, com área principal ampla e foco na escrita.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-neutral-700">Título</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                placeholder="Digite um título atraente"
                                className="w-full rounded-2xl border border-black/10 bg-[#fcfbf7] px-4 py-3 outline-none transition focus:border-[#c9a84c] focus:ring-4 focus:ring-[#c9a84c]/20"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-neutral-700">Conteúdo</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                                rows={14}
                                placeholder="Escreva o conteúdo do post..."
                                className="min-h-[24rem] w-full rounded-[1.5rem] border border-black/10 bg-[#fcfbf7] px-4 py-3 outline-none transition focus:border-[#c9a84c] focus:ring-4 focus:ring-[#c9a84c]/20"
                            />
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-2xl bg-grafia-red px-5 py-3 font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
                            >
                                {loading ? 'Criando...' : 'Salvar rascunho'}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push('/admin')}
                                className="rounded-2xl border border-black/10 bg-white px-5 py-3 font-semibold text-grafia-black transition hover:bg-[#f8f5ef]"
                            >
                                Voltar
                            </button>
                        </div>
                    </form>
                </section>

                <aside className="space-y-4">
                    <div className="rounded-[2rem] border border-black/8 bg-[#1f1b16] p-6 text-white shadow-[0_18px_60px_rgba(31,27,22,0.1)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">Editor futuro</p>
                        <h2 className="mt-3 text-xl font-semibold">Área reservada para ferramenta rica</h2>
                        <p className="mt-3 text-sm leading-6 text-white/72">
                            Esse espaço já deixa visível a estrutura para toolbar, blocos de edição e metadados do post.
                        </p>
                    </div>

                    <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_60px_rgba(31,27,22,0.06)]">
                        <h3 className="text-base font-semibold text-grafia-black">Checklist</h3>
                        <ul className="mt-4 space-y-3 text-sm text-neutral-600">
                            <li>• Título do post</li>
                            <li>• Área de texto principal</li>
                            <li>• Categorias e tags futuramente</li>
                            <li>• Publicação e rascunho</li>
                        </ul>
                    </div>
                </aside>
            </div>
    );
}