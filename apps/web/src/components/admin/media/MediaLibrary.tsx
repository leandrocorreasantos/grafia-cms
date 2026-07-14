'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, apiClient } from '@/lib/api';
import type {
  MediaFiltersState,
  MediaItem,
  MediaListResponse,
  MediaSingleResponse,
  MediaUploadResponse,
  MediaViewMode,
  UploadQueueItem,
} from '@/types';
import { EditModal } from './EditModal';
import { MediaBulkActions } from './MediaBulkActions';
import { MediaFilters } from './MediaFilters';
import { MediaGrid } from './MediaGrid';
import { MediaList } from './MediaList';
import { PreviewModal } from './PreviewModal';
import { UploadModal } from './UploadModal';

const initialFilters: MediaFiltersState = {
  search: '',
  kind: 'all',
  status: 'active',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  perPage: 25,
  page: 1,
};

type Toast = { id: string; type: 'success' | 'error'; message: string };

export function MediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filters, setFilters] = useState<MediaFiltersState>(initialFilters);
  const [meta, setMeta] = useState({ total: 0, page: 1, perPage: 25, totalPages: 1 });
  const [viewMode, setViewMode] = useState<MediaViewMode>('grid');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [editItem, setEditItem] = useState<MediaItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const canRestore = filters.status === 'trash';

  useEffect(() => {
    void loadItems();
  }, [filters]);

  useEffect(() => {
    if (!toasts.length) return;

    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [toasts]);

  const quickCounts = useMemo(() => ({
    selected: selectedIds.length,
    total: meta.total,
  }), [meta.total, selectedIds.length]);

  async function loadItems() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(filters.page),
        perPage: String(filters.perPage),
        kind: filters.kind,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      if (filters.search.trim()) {
        params.set('search', filters.search.trim());
      }

      const response = await api.get<MediaListResponse>(`/api/media?${params.toString()}`);
      setItems(response.data);
      setMeta(response.meta);
      setSelectedIds((current) => current.filter((id) => response.data.some((item) => item.id === id)));
    } catch {
      notify('error', 'Não foi possível carregar a biblioteca de mídia.');
    } finally {
      setIsLoading(false);
    }
  }

  function notify(type: Toast['type'], message: string) {
    setToasts((current) => [...current, { id: `${Date.now()}-${Math.random()}`, type, message }]);
  }

  function toggleSelection(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  function addFiles(files: File[]) {
    const queueItems = files.map<UploadQueueItem>((file) => ({
      id: `${file.name}-${file.size}-${Math.random()}`,
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      progress: 0,
      status: 'queued',
    }));

    setQueue((current) => [...current, ...queueItems]);
  }

  async function startUpload() {
    if (!queue.length) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      queue.forEach((item) => formData.append('files', item.file));

      const response = await apiClient.post<MediaUploadResponse>('/api/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          const total = event.total || 1;
          const progress = Math.round((event.loaded / total) * 100);
          setQueue((current) => current.map((item) => ({ ...item, progress, status: 'uploading' })));
        },
      });

      setQueue((current) => current.map((item) => ({ ...item, progress: 100, status: 'done' })));
      setItems((current) => [...response.data.data, ...current]);
      notify('success', `${response.data.data.length} arquivo(s) enviado(s) com sucesso.`);
      setUploadOpen(false);
      setQueue([]);
      void loadItems();
    } catch {
      setQueue((current) => current.map((item) => ({ ...item, status: 'error', error: 'Falha no upload' })));
      notify('error', 'Falha ao enviar arquivos.');
    } finally {
      setIsUploading(false);
    }
  }

  async function saveMetadata(payload: Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>) {
    if (!editItem) return;

    const response = await api.put<MediaSingleResponse>(`/api/media/${editItem.id}`, payload);
    updateLocalItem(response.data);
    setEditItem(response.data);
    notify('success', 'Metadados atualizados em tempo real.');
  }

  function updateLocalItem(item: MediaItem) {
    setItems((current) => current.map((entry) => entry.id === item.id ? item : entry));
    setPreviewItem((current) => current?.id === item.id ? item : current);
  }

  async function executeBulkAction(action: 'trash' | 'delete') {
    if (!selectedIds.length) return;
    if (action === 'delete' && !window.confirm('Excluir permanentemente os arquivos selecionados?')) return;
    if (action === 'trash' && !window.confirm('Mover os arquivos selecionados para a lixeira?')) return;

    await api.post('/api/media/bulk-delete', { ids: selectedIds, action });
    notify('success', action === 'trash' ? 'Arquivos enviados para a lixeira.' : 'Arquivos excluídos permanentemente.');
    setSelectedIds([]);
    void loadItems();
  }

  async function restoreSelected() {
    if (!selectedIds.length) return;
    await api.post('/api/media/bulk-restore', { ids: selectedIds });
    notify('success', 'Arquivos restaurados.');
    setSelectedIds([]);
    void loadItems();
  }

  async function copyUrl() {
    if (!previewItem) return;
    await navigator.clipboard.writeText(previewItem.fileUrl);
    notify('success', 'URL copiada para a área de transferência.');
  }

  function downloadSelected() {
    if (!selectedIds.length) return;
    window.open(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/media/download?ids=${selectedIds.join(',')}`, '_blank');
  }

  function downloadSingle() {
    if (!previewItem) return;
    window.open(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/media/download/${previewItem.id}`, '_blank');
  }

  return (
    <div className="media-library-shell">
      <section className="media-hero">
        <div>
          <p className="media-eyebrow">Biblioteca</p>
          <h1>Mídia</h1>
          <p>Uploads, anexos, documentos e vídeos com experiência editorial inspirada no WordPress.</p>
        </div>
        <div className="media-hero__stats">
          <div><strong>{quickCounts.total}</strong><span>arquivos</span></div>
          <div><strong>{quickCounts.selected}</strong><span>selecionados</span></div>
        </div>
      </section>

      <div className="media-layout">
        <aside className="media-sidebar">
          <button type="button" className={filters.status === 'active' && filters.kind === 'all' ? 'is-active' : ''} onClick={() => setFilters((current) => ({ ...current, status: 'active', kind: 'all', page: 1 }))}>Todas</button>
          <button type="button" className={filters.kind === 'image' ? 'is-active' : ''} onClick={() => setFilters((current) => ({ ...current, kind: 'image', status: 'active', page: 1 }))}>Imagens</button>
          <button type="button" className={filters.kind === 'document' ? 'is-active' : ''} onClick={() => setFilters((current) => ({ ...current, kind: 'document', status: 'active', page: 1 }))}>Documentos</button>
          <button type="button" className={filters.kind === 'video' ? 'is-active' : ''} onClick={() => setFilters((current) => ({ ...current, kind: 'video', status: 'active', page: 1 }))}>Vídeos</button>
          <button type="button" className={filters.kind === 'audio' ? 'is-active' : ''} onClick={() => setFilters((current) => ({ ...current, kind: 'audio', status: 'active', page: 1 }))}>Áudios</button>
          <button type="button" className={filters.status === 'trash' ? 'is-active' : ''} onClick={() => setFilters((current) => ({ ...current, status: 'trash', kind: 'all', page: 1 }))}>Lixeira</button>
        </aside>

        <section className="media-panel">
          <MediaFilters
            filters={filters}
            viewMode={viewMode}
            onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
            onToggleView={setViewMode}
            onOpenUpload={() => setUploadOpen(true)}
          />

          <MediaBulkActions
            selectedCount={selectedIds.length}
            canRestore={canRestore}
            onTrash={() => void executeBulkAction('trash')}
            onRestore={() => void restoreSelected()}
            onDelete={() => void executeBulkAction('delete')}
            onDownload={downloadSelected}
          />

          {isLoading ? (
            <div className="media-empty-state">Carregando biblioteca...</div>
          ) : !items.length ? (
            <div className="media-empty-state">Nenhum arquivo encontrado para os filtros atuais.</div>
          ) : viewMode === 'grid' ? (
            <MediaGrid items={items} selectedIds={selectedIds} onToggleSelection={toggleSelection} onPreview={setPreviewItem} />
          ) : (
            <MediaList items={items} selectedIds={selectedIds} onToggleSelection={toggleSelection} onPreview={setPreviewItem} />
          )}

          <footer className="media-pagination">
            <button type="button" className="media-button" disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>
              Anterior
            </button>
            <span>Página {meta.page} de {Math.max(meta.totalPages, 1)}</span>
            <button type="button" className="media-button" disabled={meta.page >= meta.totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>
              Próxima
            </button>
          </footer>
        </section>
      </div>

      <UploadModal
        open={uploadOpen}
        queue={queue}
        onClose={() => setUploadOpen(false)}
        onAddFiles={addFiles}
        onStartUpload={() => void startUpload()}
        isUploading={isUploading}
      />

      <PreviewModal
        item={previewItem}
        open={!!previewItem}
        onClose={() => setPreviewItem(null)}
        onEdit={() => {
          setEditItem(previewItem);
        }}
        onCopyUrl={() => void copyUrl()}
        onDownload={downloadSingle}
      />

      <EditModal
        item={editItem}
        open={!!editItem}
        onClose={() => setEditItem(null)}
        onSave={saveMetadata}
      />

      <div className="media-toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`media-toast media-toast--${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}