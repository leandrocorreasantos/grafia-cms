'use client';

import clsx from 'clsx';
import type { MediaItem } from '@/types';

interface MediaItemCardProps {
  item: MediaItem;
  selected: boolean;
  onToggleSelection: (id: string) => void;
  onPreview: (item: MediaItem) => void;
}

export function MediaItemCard({ item, selected, onToggleSelection, onPreview }: MediaItemCardProps) {
  const thumbnail = item.thumbnails?.thumbnail || item.fileUrl;

  return (
    <article className={clsx('media-card', selected && 'is-selected')}>
      <label className="media-card__select">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelection(item.id)}
          aria-label={`Selecionar ${item.originalName}`}
        />
      </label>

      <button type="button" className="media-card__preview" onClick={() => onPreview(item)}>
        {item.kind === 'image' ? (
          <img src={thumbnail} alt={item.altText || item.title || item.originalName} className="media-card__image" />
        ) : (
          <div className="media-card__file-badge">{item.fileExtension.toUpperCase()}</div>
        )}
      </button>

      <div className="media-card__body">
        <strong className="media-card__title">{item.title || item.originalName}</strong>
        <span className="media-card__meta">{item.fileSizeHuman}</span>
      </div>
    </article>
  );
}