'use client';

import clsx from 'clsx';
import type { MediaItem } from '@/types';

interface MediaListProps {
  items: MediaItem[];
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onPreview: (item: MediaItem) => void;
}

export function MediaList({ items, selectedIds, onToggleSelection, onPreview }: MediaListProps) {
  return (
    <div className="media-table-wrap">
      <table className="media-table">
        <thead>
          <tr>
            <th />
            <th>Arquivo</th>
            <th>Tipo</th>
            <th>Tamanho</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={clsx(selectedIds.includes(item.id) && 'is-selected')}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => onToggleSelection(item.id)}
                  aria-label={`Selecionar ${item.originalName}`}
                />
              </td>
              <td>
                <button type="button" className="media-table__name" onClick={() => onPreview(item)}>
                  {item.title || item.originalName}
                </button>
              </td>
              <td>{item.kind}</td>
              <td>{item.fileSizeHuman}</td>
              <td>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}