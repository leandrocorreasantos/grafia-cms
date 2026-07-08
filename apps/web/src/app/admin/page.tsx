'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Post {
    id: string;
    title: string;
    status: string;
    createdAt: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        verifySessionAndLoad();
    }, []);

    const verifySessionAndLoad = async () => {
        try {
            await api.get('/api/auth/me');
            await loadPosts();
        } catch {
            router.push('/login?next=/admin');
        }
    };

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
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-grafia-black">📊 Dashboard</h1>
                    <p className="text-gray-500">Gerencie seu conteúdo</p>
                </div>
                <Link
                    href="/admin/posts/new"
                    className="bg-grafia-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                    + Novo Post
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {posts.map((post) => (
                            <tr key={post.id}>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{post.title}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${post.status === 'published'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {post.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 text-sm space-x-2">
                                    <button className="text-blue-600 hover:text-blue-800">✏️</button>
                                    <button
                                        onClick={() => deletePost(post.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}