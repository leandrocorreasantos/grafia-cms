'use client';

import type { PostItem } from '@/types';

interface PostItemRowProps {
  post: PostItem;
  onEdit: (post: PostItem) => void;
  onPreview: (post: PostItem) => void;
  onTrash: (post: PostItem) => void;
  onRestore: (post: PostItem) => void;
  onPermanentDelete: (post: PostItem) => void;
}

export function PostItemRow({
  post,
  onEdit,
  onPreview,
  onTrash,
  onRestore,
  onPermanentDelete,
}: PostItemRowProps) {
  const isTrash = post.status === 'trash';

  return (
    <tr className="editor-posts-table__row">
      <td>
        <strong>{post.title || '(sem titulo)'}</strong>
        <small>{post.slug}</small>
      </td>
      <td>{post.status}</td>
      <td>{post.wordCount}</td>
      <td>{new Date(post.updatedAt).toLocaleString('pt-BR')}</td>
      <td className="editor-posts-table__actions">
        {!isTrash && (
          <button type="button" onClick={() => onEdit(post)}>
            Editar
          </button>
        )}
        <button type="button" onClick={() => onPreview(post)}>
          Prévia
        </button>
        {isTrash ? (
          <>
            <button type="button" onClick={() => onRestore(post)}>
              Restaurar
            </button>
            <button type="button" className="danger" onClick={() => onPermanentDelete(post)}>
              Excluir
            </button>
          </>
        ) : (
          <button type="button" onClick={() => onTrash(post)}>
            Lixeira
          </button>
        )}
      </td>
    </tr>
  );
}
