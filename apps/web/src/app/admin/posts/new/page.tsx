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
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-grafia-black mb-8">✍️ Novo Post</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Título</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-grafia-red"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Conteúdo</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                        rows={10}
                        className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-grafia-red"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-grafia-red text-white px-6 py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                    {loading ? 'Criando...' : 'Publicar Post'}
                </button>
            </form>
        </div>
    );
}