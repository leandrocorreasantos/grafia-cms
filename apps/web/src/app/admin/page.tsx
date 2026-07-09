'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowRight, Clock3, FileText, FolderTree, Tags, TrendingUp } from 'lucide-react';

interface Post {
    id: string;
    title: string;
    status: string;
    createdAt: string;
}

const stats = [
    { label: 'Posts publicados', value: '18', icon: FileText },
    { label: 'Categorias', value: '7', icon: FolderTree },
    { label: 'Tags', value: '12', icon: Tags },
    { label: 'Rascunhos', value: '4', icon: Clock3 },
];

export default function AdminDashboard() {
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            const data = await api.get<Post[]>('/api/posts');
            setPosts(data);
        } catch (error) {
            console.error('Erro ao carregar posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const deletePost = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este post?')) return;
        try {
            await api.delete(`/api/posts?id=${id}`);
            loadPosts();
        } catch (error) {
            alert('Erro ao excluir post');
        }
    };

    if (loading) return <div className="p-8">Carregando...</div>;

    return (
            <div className="space-y-8">
                <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                    <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_60px_rgba(31,27,22,0.06)] lg:p-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8c6b22]">Painel</p>
                        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h1 className="text-3xl font-semibold text-grafia-black lg:text-4xl">Dashboard editorial</h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                                    Visão geral do conteúdo, com espaço preparado para o futuro editor de texto e gestão de estrutura.
                                </p>
                            </div>
                            <Link
                                href="/admin/posts/new"
                                className="inline-flex items-center gap-2 rounded-2xl bg-grafia-red px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105"
                            >
                                Novo post
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-[#e9dfcc] bg-[#1f1b16] p-6 text-white shadow-[0_18px_60px_rgba(31,27,22,0.1)] lg:p-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">Atualização</p>
                        <h2 className="mt-3 text-2xl font-semibold">Ambiente pronto para edição visual.</h2>
                        <p className="mt-3 text-sm leading-6 text-white/72">
                            O painel já reserva o espaço principal e a navegação lateral para uma experiência semelhante à de CMSs maduros.
                        </p>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;

                        return (
                            <div key={stat.label} className="rounded-[1.75rem] border border-black/8 bg-white p-5 shadow-[0_12px_30px_rgba(31,27,22,0.05)]">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-neutral-600">{stat.label}</p>
                                    <Icon className="h-5 w-5 text-[#8c6b22]" />
                                </div>
                                <p className="mt-4 text-3xl font-semibold text-grafia-black">{stat.value}</p>
                            </div>
                        );
                    })}
                </section>

                <section className="rounded-[2rem] border border-black/8 bg-white shadow-[0_18px_60px_rgba(31,27,22,0.06)] overflow-hidden">
                    <div className="flex items-center justify-between border-b border-black/8 px-6 py-4">
                        <div>
                            <h2 className="text-lg font-semibold text-grafia-black">Posts recentes</h2>
                            <p className="text-sm text-neutral-600">Conteúdo publicado e rascunhos em destaque.</p>
                        </div>
                        <Link href="/admin/posts" className="text-sm font-semibold text-[#8c6b22] hover:underline">
                            Ver todos
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-black/8">
                            <thead className="bg-[#f8f5ef]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Título</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Data</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/8">
                                {posts.map((post) => (
                                    <tr key={post.id} className="hover:bg-[#fcfbf7]">
                                        <td className="px-6 py-4 text-sm font-medium text-grafia-black">{post.title}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${post.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {post.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-600">
                                            {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center gap-3">
                                                <button className="font-medium text-[#8c6b22] transition hover:text-[#6d5318]">Editar</button>
                                                <button onClick={() => deletePost(post.id)} className="font-medium text-[#c41a1a] transition hover:text-[#8f1212]">
                                                    Excluir
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
    );
}