'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { PostItem } from '@/types';
import { PostItemRow } from './PostItem';

export function PostListManager() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | PostItem['status']>('all');

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (status !== 'all') params.set('status', status);
    params.set('sortBy', 'updatedAt');
    params.set('sortOrder', 'desc');
    params.set('page', '1');
    params.set('perPage', '100');
    return params.toString();
  }, [search, status]);

  useEffect(() => {
    void loadPosts();
  }, [query]);

  async function loadPosts() {
    setLoading(true);
    try {
      const data = await api.get<PostItem[]>(`/api/posts?${query}`);
      setPosts(data);
    } finally {
      setLoading(false);
    }
  }

  function previewPost(post: PostItem) {
    const preview = window.open('', '_blank');
    if (!preview) return;

    preview.document.write(`
      <html lang="pt-BR">
        <head><title>${post.title}</title><meta charset="utf-8"/></head>
        <body style="font-family:system-ui;padding:24px;max-width:860px;margin:0 auto;line-height:1.7;">
          <h1>${post.title}</h1>
          ${post.cover ? `<img src="${post.cover}" alt="Capa" style="max-width:100%;border-radius:12px;margin:16px 0;"/>` : ''}
          ${post.content}
        </body>
      </html>
    `);
    preview.document.close();
  }

  async function trashPost(post: PostItem) {
    await api.delete(`/api/posts/${post.id}`);
    await loadPosts();
  }

  async function restorePost(post: PostItem) {
    await api.post(`/api/posts/${post.id}/restore`, {});
    await loadPosts();
  }

  async function permanentDelete(post: PostItem) {
    if (!window.confirm('Excluir permanentemente este post?')) return;
    await api.delete(`/api/posts/${post.id}/permanent`);
    await loadPosts();
  }

  return (
    <section className="editor-posts-shell">
      <header className="editor-posts-header">
        <div>
          <p className="media-eyebrow">Conteudo</p>
          <h1>Gerenciamento de posts</h1>
          <p>Busca, filtros, lixeira e atalhos para o editor WYSIWYG.</p>
        </div>
        <button type="button" className="media-button media-button--primary" onClick={() => router.push('/admin/posts/new')}>
          Novo post
        </button>
      </header>

      <div className="editor-posts-filters">
        <input className="media-input" placeholder="Buscar por titulo, slug ou conteudo" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select className="media-select" value={status} onChange={(event) => setStatus(event.target.value as any)}>
          <option value="all">Todos os status</option>
          <option value="draft">Rascunho</option>
          <option value="pending">Pendente</option>
          <option value="published">Publicado</option>
          <option value="trash">Lixeira</option>
        </select>
      </div>

      <div className="editor-posts-table-wrap">
        <table className="editor-posts-table">
          <thead>
            <tr>
              <th>Titulo</th>
              <th>Status</th>
              <th>Palavras</th>
              <th>Atualizado</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>Carregando posts...</td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={5}>Nenhum post encontrado.</td>
              </tr>
            ) : (
              posts.map((post) => (
                <PostItemRow
                  key={post.id}
                  post={post}
                  onEdit={(item) => router.push(`/admin/posts/${item.id}/edit`)}
                  onPreview={previewPost}
                  onTrash={trashPost}
                  onRestore={restorePost}
                  onPermanentDelete={permanentDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
