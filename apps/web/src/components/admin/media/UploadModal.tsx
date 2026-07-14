'use client';

import { useMemo, useRef } from 'react';
import type { UploadQueueItem } from '@/types';

interface UploadModalProps {
  open: boolean;
  queue: UploadQueueItem[];
  onClose: () => void;
  onAddFiles: (files: File[]) => void;
  onStartUpload: () => void;
  isUploading: boolean;
}

export function UploadModal({ open, queue, onClose, onAddFiles, onStartUpload, isUploading }: UploadModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingCount = useMemo(() => queue.filter((item) => item.status !== 'done').length, [queue]);

  if (!open) return null;

  return (
    <div className="media-modal-backdrop" role="presentation">
      <div className="media-modal media-modal--wide" role="dialog" aria-modal="true" aria-label="Enviar arquivos">
        <header className="media-modal__header">
          <h2>Upload de arquivos</h2>
          <button type="button" className="media-icon-button" onClick={onClose}>Fechar</button>
        </header>

        <button
          type="button"
          className="media-dropzone"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            onAddFiles(Array.from(event.dataTransfer.files));
          }}
        >
          <strong>Arraste arquivos aqui</strong>
          <span>ou clique para selecionar múltiplos arquivos</span>
        </button>

        <input
          ref={inputRef}
          type="file"
          className="visually-hidden"
          multiple
          onChange={(event) => onAddFiles(Array.from(event.target.files ?? []))}
        />

        <div className="upload-queue">
          {queue.map((item) => (
            <article key={item.id} className="upload-queue__item">
              <div className="upload-queue__preview">
                {item.previewUrl ? <img src={item.previewUrl} alt={item.file.name} /> : <span>{item.file.name.split('.').pop()?.toUpperCase()}</span>}
              </div>
              <div className="upload-queue__content">
                <strong>{item.file.name}</strong>
                <span>{Math.round(item.file.size / 1024)} KB</span>
                <div className="upload-queue__progress">
                  <div style={{ width: `${item.progress}%` }} />
                </div>
                <small>{item.error || item.status}</small>
              </div>
            </article>
          ))}
        </div>

        <footer className="media-modal__footer">
          <span>{pendingCount} arquivo(s) aguardando</span>
          <button type="button" className="media-button media-button--primary" onClick={onStartUpload} disabled={!queue.length || isUploading}>
            {isUploading ? 'Enviando...' : 'Iniciar upload'}
          </button>
        </footer>
      </div>
    </div>
  );
}