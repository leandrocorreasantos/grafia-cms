'use client';

interface MediaBulkActionsProps {
  selectedCount: number;
  canRestore: boolean;
  onTrash: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onDownload: () => void;
}

export function MediaBulkActions({ selectedCount, canRestore, onTrash, onRestore, onDelete, onDownload }: MediaBulkActionsProps) {
  return (
    <section className="media-bulk-actions">
      <span>{selectedCount} item(ns) selecionado(s)</span>
      <div className="media-bulk-actions__buttons">
        <button type="button" className="media-button" onClick={onTrash} disabled={!selectedCount}>
          Mover para lixeira
        </button>
        <button type="button" className="media-button" onClick={onRestore} disabled={!selectedCount || !canRestore}>
          Restaurar
        </button>
        <button type="button" className="media-button" onClick={onDownload} disabled={!selectedCount}>
          Baixar ZIP
        </button>
        <button type="button" className="media-button media-button--danger" onClick={onDelete} disabled={!selectedCount}>
          Excluir permanentemente
        </button>
      </div>
    </section>
  );
}