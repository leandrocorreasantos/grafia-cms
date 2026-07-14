'use client';

import type { MediaItem } from '@/types';
import { MediaItemCard } from './MediaItemCard';

interface MediaGridProps {
  items: MediaItem[];
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onPreview: (item: MediaItem) => void;
}

export function MediaGrid({ items, selectedIds, onToggleSelection, onPreview }: MediaGridProps) {
  return (
    <div className="media-grid">
      {items.map((item) => (
        <MediaItemCard
          key={item.id}
          item={item}
          selected={selectedIds.includes(item.id)}
          onToggleSelection={onToggleSelection}
          onPreview={onPreview}
        />
      ))}
    </div>
  );
}