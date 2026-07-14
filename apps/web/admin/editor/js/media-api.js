/**
 * Grafia CMS — Media API Client
 * Cliente JavaScript para a API REST de mídia do Grafia CMS.
 * Comunica-se com os endpoints em /api/media/...
 */

const MediaAPI = (function () {
  'use strict';

  /* ============================================
     CONFIGURAÇÃO
     ============================================ */
  const BASE_URL = '/api/media';
  const PER_PAGE = 20;

  /**
   * Obtém o token JWT armazenado (sessionStorage ou localStorage)
   */
  function getToken() {
    return sessionStorage.getItem('grafia_token') ||
           localStorage.getItem('grafia_token');
  }

  /**
   * Faz uma requisição autenticada para a API
   */
  async function request(method, path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const headers = {
      'Accept': 'application/json',
    };

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchOptions = {
      method,
      headers,
    };

    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(options.body);
    } else if (options.body instanceof FormData) {
      // Não setar Content-Type para FormData (browser gerencia boundary)
      fetchOptions.body = options.body;
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `Erro ${response.status}: ${response.statusText}` };
      }
      throw new Error(errorData.error || `Erro na requisição (${response.status})`);
    }

    // Se for download de arquivo
    if (options.raw) {
      return response;
    }

    const text = await response.text();
    if (!text) return {};
    return JSON.parse(text);
  }

  /* ============================================
     API PÚBLICA
     ============================================ */
  return {

    /**
     * Lista arquivos de mídia com filtros e paginação
     * @param {Object} params
     * @param {string} [params.search] - Termo de busca
     * @param {string} [params.kind='all'] - Tipo (image, video, audio, document, all)
     * @param {number} [params.page=1] - Número da página
     * @param {number} [params.perPage=20] - Itens por página
     * @param {string} [params.sortBy='createdAt'] - Ordenação
     * @param {string} [params.sortOrder='desc'] - Direção
     * @returns {Promise<{data: Array, meta: {total: number, page: number, perPage: number, totalPages: number}}>}
     */
    async list(params = {}) {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.kind && params.kind !== 'all') query.set('kind', params.kind);
      if (params.page) query.set('page', String(params.page));
      if (params.perPage) query.set('perPage', String(params.perPage));
      if (params.sortBy) query.set('sortBy', params.sortBy);
      if (params.sortOrder) query.set('sortOrder', params.sortOrder);
      if (params.status) query.set('status', params.status);

      const qs = query.toString();
      return request('GET', qs ? `?${qs}` : '');
    },

    /**
     * Obtém um arquivo de mídia pelo ID
     */
    async getById(id) {
      const result = await request('GET', `/${id}`);
      return result.data;
    },

    /**
     * Faz upload de arquivos
     * @param {FileList|File[]} files - Arquivos para upload
     * @param {string} [folder='/'] - Pasta de destino
     * @returns {Promise<Array>}
     */
    async upload(files, folder = '/') {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });
      if (folder) formData.append('folder', folder);

      const result = await request('POST', '/upload', { body: formData });
      return result.data || [];
    },

    /**
     * Atualiza metadados de um arquivo
     */
    async update(id, data) {
      const result = await request('PUT', `/${id}`, { body: data });
      return result.data;
    },

    /**
     * Move para lixeira
     */
    async trash(id) {
      return request('DELETE', `/${id}`);
    },

    /**
     * Restaura da lixeira
     */
    async restore(id) {
      return request('POST', `/${id}/restore`);
    },

    /**
     * Exclui permanentemente
     */
    async permanentDelete(id) {
      return request('DELETE', `/${id}/permanent`);
    },

    /**
     * Ação em massa (trash/delete)
     */
    async bulkAction(ids, action = 'trash') {
      return request('POST', '/bulk-delete', { body: { ids, action } });
    },

    /**
     * Restaura em massa
     */
    async bulkRestore(ids) {
      return request('POST', '/bulk-restore', { body: { ids } });
    },

    /**
     * Busca rápida (wrapper de list para search)
     */
    async search(query) {
      return this.list({ search: query, perPage: 50 });
    },

    /**
     * Obtém URL de thumbnail ou placeholder
     */
    getThumbnailUrl(mediaItem) {
      if (mediaItem.thumbnails?.thumbnail) {
        return mediaItem.thumbnails.thumbnail;
      }
      if (mediaItem.fileUrl) {
        return mediaItem.fileUrl;
      }
      return null;
    },

    /**
     * Formata tamanho de arquivo para exibição
     */
    formatFileSize(bytes) {
      if (typeof bytes !== 'number') return '—';
      const units = ['B', 'KB', 'MB', 'GB'];
      let i = 0;
      let size = bytes;
      while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i++;
      }
      return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
    },

    /**
     * Determina o tipo de mídia para ícone
     */
    getMediaIcon(kind) {
      const icons = {
        image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
        video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
        audio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
        document: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
      };
      return icons[kind] || icons.document;
    },

  };
})();
