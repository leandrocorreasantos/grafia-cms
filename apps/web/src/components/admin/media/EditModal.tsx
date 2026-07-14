'use client';

import { useEffect, useState } from 'react';
import type { MediaItem } from '@/types';

interface EditModalProps {
  item: MediaItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (payload: Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>) => Promise<void>;
}

export function EditModal({ item, open, onClose, onSave }: EditModalProps) {
  const [form, setForm] = useState({ title: '', altText: '', caption: '', description: '' });

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title || '',
        altText: item.altText || '',
        caption: item.caption || '',
        description: item.description || '',
      });
    }
  }, [item]);

  if (!open || !item) return null;

  return (
    <div className="media-modal-backdrop" role="presentation">
      <div className="media-modal" role="dialog" aria-modal="true" aria-label="Editar mídia">
        <header className="media-modal__header">
          <h2>Editar metadados</h2>
          <button type="button" className="media-icon-button" onClick={onClose}>Fechar</button>
        </header>

        <div className="media-form-grid">
          <label>
            <span>Título</span>
            <input className="media-input" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label>
            <span>Texto alternativo</span>
            <input className="media-input" value={form.altText} onChange={(event) => setForm((current) => ({ ...current, altText: event.target.value }))} />
          </label>
          <label>
            <span>Legenda</span>
            <input className="media-input" value={form.caption} onChange={(event) => setForm((current) => ({ ...current, caption: event.target.value }))} />
          </label>
          <label>
            <span>Descrição</span>
            <textarea className="media-textarea" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </label>
        </div>

        <footer className="media-modal__footer">
          <button type="button" className="media-button" onClick={onClose}>Cancelar</button>
          <button type="button" className="media-button media-button--primary" onClick={() => void onSave(form)}>
            Salvar alterações
          </button>
        </footer>
      </div>
    </div>
  );
}