'use client';

import type { MediaItem } from '@/types';

interface PreviewModalProps {
  item: MediaItem | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onCopyUrl: () => void;
  onDownload: () => void;
}

export function PreviewModal({ item, open, onClose, onEdit, onCopyUrl, onDownload }: PreviewModalProps) {
  if (!open || !item) return null;

  return (
    <div className="media-modal-backdrop" role="presentation">
      <div className="media-modal media-modal--preview" role="dialog" aria-modal="true" aria-label="Visualizar mídia">
        <header className="media-modal__header">
          <h2>{item.title || item.originalName}</h2>
          <button type="button" className="media-icon-button" onClick={onClose}>Fechar</button>
        </header>

        <div className="media-preview-layout">
          <div className="media-preview-stage">
            {item.kind === 'image' ? (
              <img src={item.fileUrl} alt={item.altText || item.originalName} className="media-preview-stage__image" />
            ) : (
              <div className="media-preview-stage__fallback">{item.fileExtension.toUpperCase()}</div>
            )}
          </div>

          <aside className="media-preview-sidebar">
            <dl>
              <div><dt>Nome</dt><dd>{item.originalName}</dd></div>
              <div><dt>Tipo</dt><dd>{item.mimeType}</dd></div>
              <div><dt>Tamanho</dt><dd>{item.fileSizeHuman}</dd></div>
              <div><dt>Dimensões</dt><dd>{item.width && item.height ? `${item.width}x${item.height}` : 'n/d'}</dd></div>
              <div><dt>Shortcode</dt><dd>{item.shortcode || 'n/d'}</dd></div>
            </dl>

            <div className="media-preview-sidebar__actions">
              <button type="button" className="media-button media-button--primary" onClick={onEdit}>Editar</button>
              <button type="button" className="media-button" onClick={onCopyUrl}>Copiar URL</button>
              <button type="button" className="media-button" onClick={onDownload}>Baixar arquivo</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}