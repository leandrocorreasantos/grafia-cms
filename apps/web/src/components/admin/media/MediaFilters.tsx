'use client';

import type { MediaFiltersState, MediaViewMode } from '@/types';

interface MediaFiltersProps {
  filters: MediaFiltersState;
  viewMode: MediaViewMode;
  onChange: (patch: Partial<MediaFiltersState>) => void;
  onToggleView: (view: MediaViewMode) => void;
  onOpenUpload: () => void;
}

export function MediaFilters({ filters, viewMode, onChange, onToggleView, onOpenUpload }: MediaFiltersProps) {
  return (
    <section className="media-toolbar">
      <div className="media-toolbar__actions">
        <button type="button" className="media-button media-button--primary" onClick={onOpenUpload}>
          Adicionar nova mídia
        </button>

        <input
          className="media-input"
          placeholder="Buscar por nome, título ou descrição"
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value, page: 1 })}
        />
      </div>

      <div className="media-toolbar__filters">
        <select className="media-select" value={filters.kind} onChange={(event) => onChange({ kind: event.target.value as MediaFiltersState['kind'], page: 1 })}>
          <option value="all">Todos os tipos</option>
          <option value="image">Imagens</option>
          <option value="document">Documentos</option>
          <option value="video">Vídeos</option>
          <option value="audio">Áudios</option>
          <option value="other">Outros</option>
        </select>

        <select className="media-select" value={filters.sortBy} onChange={(event) => onChange({ sortBy: event.target.value as MediaFiltersState['sortBy'] })}>
          <option value="createdAt">Mais recentes</option>
          <option value="name">Nome</option>
          <option value="fileSize">Tamanho</option>
        </select>

        <select className="media-select" value={filters.perPage} onChange={(event) => onChange({ perPage: Number(event.target.value), page: 1 })}>
          <option value={10}>10 por página</option>
          <option value={25}>25 por página</option>
          <option value={50}>50 por página</option>
          <option value={100}>100 por página</option>
        </select>

        <div className="media-view-toggle">
          <button type="button" className={viewMode === 'grid' ? 'is-active' : ''} onClick={() => onToggleView('grid')}>
            Grade
          </button>
          <button type="button" className={viewMode === 'list' ? 'is-active' : ''} onClick={() => onToggleView('list')}>
            Lista
          </button>
        </div>
      </div>
    </section>
  );
}