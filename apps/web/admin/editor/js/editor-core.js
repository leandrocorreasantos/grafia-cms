/**
 * Grafia CMS — Editor WYSIWYG Core
 * Editor de conteúdo completo com formatação, mídia e integração com API.
 */

(function () {
  'use strict';

  /* ============================================
     VARIÁVEIS DE ESTADO
     ============================================ */
  let currentPostId = null;
  let isDirty = false;
  let isSaving = false;
  let htmlMode = false;
  let isFullscreen = false;
  let autosaveTimer = null;
  const AUTOSAVE_INTERVAL = 30000; // 30 segundos
  let selectedMedia = [];
  let mediaPage = 1;
  let mediaTotalPages = 1;
  let mediaSearchTerm = '';
  let mediaKindFilter = 'all';
  let categories = [];
  let tags = [];

  /* ============================================
     DOM REFS
     ============================================ */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const editor = {
    title: $('#postTitle'),
    content: $('#editorContent'),
    textarea: $('#editorTextarea'),
    toolbar: $('#editorToolbar'),
    slug: $('#postSlug'),
    slugText: $('#slugText'),
    status: $('#postStatus'),
    publishDate: $('#postPublishDate'),
    excerpt: $('#postExcerpt'),
    featuredArea: $('#featuredImageArea'),
    featuredImg: $('#featuredImageImg'),
    featuredPreview: $('#featuredImagePreview'),
    featuredPlaceholder: $('#featuredImagePlaceholder'),
    categorySelect: $('#categorySelect'),
    categoryList: $('#categoryList'),
    tagInput: $('#tagInput'),
    tagList: $('#tagList'),
    autosaveIndicator: $('#autosaveIndicator'),
    statusIndicator: $('#statusIndicator'),
    lastSaved: $('#lastSaved'),
    wordCount: $('#wordCount'),
    charCount: $('#charCount'),
    imageCount: $('#imageCount'),
    linkCount: $('#linkCount'),
  };

  // Modais
  const modals = {
    preview: $('#previewModal'),
    link: $('#linkModal'),
    media: $('#mediaModal'),
    mediaDetail: $('#mediaDetailModal'),
  };

  // Mídia
  const mediaUI = {
    grid: $('#mediaGrid'),
    search: $('#mediaSearch'),
    kindFilter: $('#mediaKindFilter'),
    dropzone: $('#mediaDropzone'),
    fileInput: $('#mediaFileInput'),
    prevBtn: $('#mediaPrevPage'),
    nextBtn: $('#mediaNextPage'),
    pageInfo: $('#mediaPageInfo'),
    insertBtn: $('#btnInsertMedia'),
    uploadBtn: $('#btnMediaUpload'),
  };

  /* ============================================
     UTILITÁRIOS
     ============================================ */
  function formatDate(date) {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function getContent() {
    return htmlMode ? editor.textarea.value : editor.content.innerHTML;
  }

  function setContent(html) {
    if (htmlMode) {
      editor.textarea.value = html;
    } else {
      editor.content.innerHTML = html;
    }
    updateStats();
  }

  /* ============================================
     ESTATÍSTICAS DO CONTEÚDO
     ============================================ */
  function updateStats() {
    const html = getContent();
    const text = html
      .replace(/<style[^>]*>.*?<\/style>/gis, ' ')
      .replace(/<script[^>]*>.*?<\/script>/gis, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    const images = (html.match(/<img\b/gi) || []).length;
    const links = (html.match(/<a\b/gi) || []).length;

    editor.wordCount.textContent = words;
    editor.charCount.textContent = chars;
    editor.imageCount.textContent = images;
    editor.linkCount.textContent = links;
  }

  /* ============================================
     GERENCIAMENTO DE SLUG
     ============================================ */
  function generateSlug(text) {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  function updateSlug() {
    const title = editor.title.value.trim();
    if (!editor.slug.value || editor.slug.dataset.auto === 'true') {
      const slug = generateSlug(title);
      editor.slug.value = slug;
      editor.slug.dataset.auto = 'true';
      editor.slugText.textContent = slug || 'slug-do-post';
    } else {
      editor.slugText.textContent = editor.slug.value || 'slug-do-post';
    }
  }

  /* ============================================
     FORMATTAÇÃO (execCommand)
     ============================================ */
  function execFormat(cmd, value = null) {
    if (htmlMode) return;
    document.execCommand(cmd, false, value);
    editor.content.focus();
    updateStats();
    markDirty();
  }

  /* ============================================
     TOOLBAR — EVENTOS
     ============================================ */
  function setupToolbar() {
    // Botões de formatação
    editor.toolbar.addEventListener('click', function (e) {
      const btn = e.target.closest('.toolbar-btn');
      if (!btn) return;

      const cmd = btn.dataset.cmd;
      if (!cmd) return;

      e.preventDefault();

      switch (cmd) {
        case 'createLink':
          openLinkModal();
          break;
        case 'unlink':
          execFormat('unlink');
          break;
        case 'formatBlock':
          execFormat('formatBlock', btn.dataset.value);
          break;
        default:
          execFormat(cmd);
      }
    });

    // Atualizar estado ativo dos botões
    editor.content.addEventListener('mouseup', updateToolbarState);
    editor.content.addEventListener('keyup', updateToolbarState);
  }

  function updateToolbarState() {
    if (htmlMode) return;
    const btns = editor.toolbar.querySelectorAll('.toolbar-btn[data-cmd]');
    btns.forEach((btn) => {
      const cmd = btn.dataset.cmd;
      if (!cmd) return;

      let active = false;
      try {
        if (cmd === 'formatBlock') {
          const value = btn.dataset.value;
          const current = document.queryCommandValue('formatBlock');
          active = current === value || current === `<${value}>`;
        } else if (['bold', 'italic', 'underline', 'strikeThrough',
                     'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull',
                     'insertUnorderedList', 'insertOrderedList'].includes(cmd)) {
          active = document.queryCommandState(cmd);
        }
      } catch (e) { /* ignora */ }

      btn.classList.toggle('active', active);
    });
  }

  /* ============================================
     MODAL DE LINK
     ============================================ */
  function openLinkModal() {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    // Verificar se já está em um link
    let node = selection.anchorNode;
    while (node && node.nodeType === 1 && node.nodeName !== 'A') {
      node = node.parentElement;
    }

    $('#linkUrl').value = node && node.nodeName === 'A' ? node.href : '';
    $('#linkText').value = text || '';
    $('#linkTarget').checked = node && node.nodeName === 'A' ? node.target === '_blank' : true;

    modals.link.style.display = 'flex';
    $('#linkUrl').focus();
  }

  function setupLinkModal() {
    $('#btnLinkConfirm').addEventListener('click', function () {
      const url = $('#linkUrl').value.trim();
      let text = $('#linkText').value.trim();

      if (!url) return;

      // Valida URL
      let finalUrl = url;
      if (!/^https?:\/\//i.test(url)) {
        finalUrl = `https://${url}`;
      }

      const sel = window.getSelection();
      const range = sel.getRangeAt(0);

      if (text) {
        // Inserir link com texto específico
        const link = document.createElement('a');
        link.href = finalUrl;
        link.target = $('#linkTarget').checked ? '_blank' : '_self';
        link.rel = $('#linkTarget').checked ? 'noopener noreferrer' : '';
        link.textContent = text;
        range.deleteContents();
        range.insertNode(link);
      } else if (sel.toString().trim()) {
        // Usar seleção atual
        execFormat('createLink', finalUrl);
        if ($('#linkTarget').checked) {
          const sel2 = window.getSelection();
          const range2 = sel2.getRangeAt(0);
          let link = range2.startContainer;
          while (link && link.nodeName !== 'A') link = link.parentElement;
          if (link) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
          }
        }
      }

      closeModal('linkModal');
      updateStats();
      markDirty();
    });

    // Enter no campo URL confirma
    $('#linkUrl').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        $('#btnLinkConfirm').click();
      }
    });
  }

  /* ============================================
     MODAL PRÉ-VISUALIZAÇÃO
     ============================================ */
  function setupPreview() {
    $('#btnPreview').addEventListener('click', function () {
      const title = editor.title.value.trim() || 'Sem título';
      const content = getContent();

      const previewHtml = `
        <h1 style="font-size:2rem;font-weight:700;margin-bottom:.5em">${escapeHtml(title)}</h1>
        <div class="preview-content">${content}</div>
      `;

      $('#previewContent').innerHTML = previewHtml;
      modals.preview.style.display = 'flex';
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ============================================
     MODAIS — ABRIR/FECHAR
     ============================================ */
  function openModal(id) {
    document.getElementById(id).style.display = 'flex';
  }

  function closeModal(id) {
    document.getElementById(id).style.display = 'none';
  }

  function setupModals() {
    // Fechar ao clicar no overlay
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', function (e) {
        if (e.target === this) {
          this.style.display = 'none';
        }
      });
    });

    // Fechar com botão X
    document.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', function () {
        closeModal(this.dataset.close);
      });
    });

    // Fechar com Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay[style*="flex"]').forEach((m) => {
          m.style.display = 'none';
        });
      }
    });
  }

  /* ============================================
     HTML MODE
     ============================================ */
  function setupHtmlMode() {
    $('#btnHtmlMode').addEventListener('click', function () {
      htmlMode = !htmlMode;

      if (htmlMode) {
        editor.textarea.value = editor.content.innerHTML;
        editor.content.style.display = 'none';
        editor.textarea.style.display = 'block';
        this.classList.add('active');
      } else {
        editor.content.innerHTML = editor.textarea.value;
        editor.content.style.display = 'block';
        editor.textarea.style.display = 'none';
        this.classList.remove('active');
        updateStats();
      }
    });
  }

  /* ============================================
     FULLSCREEN
     ============================================ */
  function setupFullscreen() {
    $('#btnFullscreen').addEventListener('click', function () {
      isFullscreen = !isFullscreen;
      document.querySelector('.editor-layout').classList.toggle('fullscreen', isFullscreen);

      if (isFullscreen) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    });

    document.addEventListener('fullscreenchange', function () {
      isFullscreen = !!document.fullscreenElement;
      document.querySelector('.editor-layout').classList.toggle('fullscreen', isFullscreen);
    });
  }

  /* ============================================
     AUTO-SAVE
     ============================================ */
  function markDirty() {
    if (!isDirty) {
      isDirty = true;
      editor.autosaveIndicator.textContent = 'Não salvo';
      editor.autosaveIndicator.className = 'autosave-indicator';
    }
  }

  function startAutosave() {
    autosaveTimer = setInterval(function () {
      if (isDirty && currentPostId) {
        savePost(true);
      }
    }, AUTOSAVE_INTERVAL);
  }

  async function savePost(autosave = false) {
    if (isSaving) return;
    isSaving = true;

    editor.autosaveIndicator.textContent = 'Salvando...';
    editor.autosaveIndicator.className = 'autosave-indicator saving';

    const data = gatherPostData();

    try {
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      let response;
      if (currentPostId) {
        const url = autosave
          ? `/api/posts/${currentPostId}/autosave`
          : `/api/posts/${currentPostId}`;
        response = await fetch(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data),
        });
      } else {
        response = await fetch('/api/posts', {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        });
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao salvar');
      }

      const result = await response.json();
      const post = result.post || result;

      if (!currentPostId) {
        currentPostId = post.id;
        history.replaceState(null, '', `?id=${post.id}`);
      }

      isDirty = false;
      editor.autosaveIndicator.textContent = autosave ? '✓ Auto-salvo' : '✓ Salvo';
      editor.autosaveIndicator.className = 'autosave-indicator saved';
      editor.lastSaved.textContent = `Último salvamento: ${formatDate(new Date())}`;

      // Atualizar status
      if (post.status) {
        editor.status.value = post.status;
        editor.statusIndicator.dataset.status = post.status;
        editor.statusIndicator.textContent = {
          draft: 'Rascunho',
          published: 'Publicado',
          archived: 'Arquivado',
        }[post.status] || post.status;
      }

    } catch (error) {
      editor.autosaveIndicator.textContent = '✗ Erro ao salvar';
      editor.autosaveIndicator.className = 'autosave-indicator error';
      console.error('Save error:', error);
      alert(`Erro ao salvar: ${error.message}`);
    } finally {
      isSaving = false;
    }
  }

  function gatherPostData() {
    const content = getContent();
    return {
      title: editor.title.value.trim(),
      content: content,
      slug: editor.slug.value.trim() || generateSlug(editor.title.value),
      status: editor.status.value,
      excerpt: editor.excerpt.value.trim(),
      cover: editor.featuredImg.src || undefined,
      publishedAt: editor.publishDate.value ? new Date(editor.publishDate.value).toISOString() : undefined,
      categoryIds: Array.from(editor.categoryList.querySelectorAll('.tag-item')).map((el) => el.dataset.id),
      tags: Array.from(editor.tagList.querySelectorAll('.tag-item')).map((el) => el.textContent.trim().replace('×', '').trim()),
    };
  }

  function getToken() {
    return sessionStorage.getItem('grafia_token') ||
           localStorage.getItem('grafia_token');
  }

  /* ============================================
     BOTÕES: SALVAR / PUBLICAR
     ============================================ */
  function setupActionButtons() {
    $('#btnSaveDraft').addEventListener('click', function () {
      editor.status.value = 'draft';
      savePost(false);
    });

    $('#btnPublish').addEventListener('click', function () {
      if (editor.publishDate.value) {
        editor.status.value = 'scheduled';
      } else {
        editor.status.value = 'published';
      }
      savePost(false);
    });
  }

  /* ============================================
     CATEGORIAS E TAGS
     ============================================ */
  async function loadCategories() {
    try {
      const token = getToken();
      const response = await fetch('/api/categories', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        categories = await response.json();
        editor.categorySelect.innerHTML = '<option value="">Selecione uma categoria...</option>' +
          categories.map((cat) =>
            `<option value="${cat.id}">${cat.name}</option>`
          ).join('');
      }
    } catch (e) {
      console.error('Erro ao carregar categorias:', e);
    }
  }

  function setupCategories() {
    editor.categorySelect.addEventListener('change', function () {
      const id = this.value;
      if (!id) return;

      const cat = categories.find((c) => c.id === id);
      if (!cat) return;

      addCategoryTag(cat.id, cat.name);
      this.value = '';
      markDirty();
    });
  }

  function addCategoryTag(id, name) {
    // Evitar duplicatas
    if (editor.categoryList.querySelector(`[data-id="${id}"]`)) return;

    const tag = document.createElement('span');
    tag.className = 'tag-item';
    tag.dataset.id = id;
    tag.innerHTML = `${name} <button data-action="remove-category" data-id="${id}">&times;</button>`;
    editor.categoryList.appendChild(tag);
  }

  function setupTags() {
    editor.tagInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const name = this.value.trim();
        if (name) {
          addTag(name);
          this.value = '';
          markDirty();
        }
      }
    });
  }

  function addTag(name) {
    // Evitar duplicatas
    const existing = Array.from(editor.tagList.querySelectorAll('.tag-item'));
    if (existing.some((el) => el.textContent.trim().replace('×', '').trim().toLowerCase() === name.toLowerCase())) return;

    const tag = document.createElement('span');
    tag.className = 'tag-item';
    tag.innerHTML = `${name} <button data-action="remove-tag">&times;</button>`;
    editor.tagList.appendChild(tag);
  }

  // Delegar remoção de tags/categorias
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-action="remove-category"], [data-action="remove-tag"]');
    if (!btn) return;
    btn.closest('.tag-item').remove();
    markDirty();
  });

  /* ============================================
     IMAGEM DESTACADA
     ============================================ */
  function setupFeaturedImage() {
    editor.featuredArea.addEventListener('click', function () {
      // Abrir modal de mídia em modo de seleção única para imagem destacada
      window.__featuredMode = true;
      openMediaModal();
    });

    $('#btnRemoveFeatured').addEventListener('click', function (e) {
      e.stopPropagation();
      editor.featuredImg.src = '';
      editor.featuredPreview.style.display = 'none';
      editor.featuredPlaceholder.style.display = 'flex';
      markDirty();
    });
  }

  /* ============================================
     BIBLIOTECA DE MÍDIA — MODAL
     ============================================ */
  function openMediaModal() {
    modals.media.style.display = 'flex';
    mediaPage = 1;
    selectedMedia = [];
    loadMediaGrid();
  }

  $('#btnOpenMedia').addEventListener('click', openMediaModal);

  function setupMediaModal() {
    // Busca com debounce
    let searchTimeout;
    mediaUI.search.addEventListener('input', function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        mediaSearchTerm = this.value.trim();
        mediaPage = 1;
        loadMediaGrid();
      }, 300);
    });

    // Filtro de tipo
    mediaUI.kindFilter.addEventListener('change', function () {
      mediaKindFilter = this.value;
      mediaPage = 1;
      loadMediaGrid();
    });

    // Upload
    mediaUI.uploadBtn.addEventListener('click', function () {
      mediaUI.dropzone.style.display = mediaUI.dropzone.style.display === 'none' ? 'block' : 'none';
    });

    mediaUI.fileInput.addEventListener('change', function () {
      if (this.files.length) {
        uploadFiles(this.files);
      }
    });

    // Drag & drop no dropzone
    mediaUI.dropzone.addEventListener('dragover', function (e) {
      e.preventDefault();
      this.classList.add('drag-over');
    });

    mediaUI.dropzone.addEventListener('dragleave', function () {
      this.classList.remove('drag-over');
    });

    mediaUI.dropzone.addEventListener('drop', function (e) {
      e.preventDefault();
      this.classList.remove('drag-over');
      if (e.dataTransfer.files.length) {
        uploadFiles(e.dataTransfer.files);
      }
    });

    mediaUI.dropzone.addEventListener('click', function () {
      mediaUI.fileInput.click();
    });

    // Paginação
    mediaUI.prevBtn.addEventListener('click', function () {
      if (mediaPage > 1) { mediaPage--; loadMediaGrid(); }
    });
    mediaUI.nextBtn.addEventListener('click', function () {
      if (mediaPage < mediaTotalPages) { mediaPage++; loadMediaGrid(); }
    });

    // Inserir mídia no post
    mediaUI.insertBtn.addEventListener('click', function () {
      if (selectedMedia.length === 0) return;

      if (window.__featuredMode) {
        // Imagem destacada
        const media = selectedMedia[0];
        editor.featuredImg.src = media.fileUrl;
        editor.featuredPreview.style.display = 'block';
        editor.featuredPlaceholder.style.display = 'none';
        window.__featuredMode = false;
        closeModal('mediaModal');
        markDirty();
        return;
      }

      insertSelectedMedia();
    });
  }

  async function loadMediaGrid() {
    mediaUI.grid.innerHTML = '<div class="media-loading">Carregando...</div>';

    try {
      const result = await MediaAPI.list({
        search: mediaSearchTerm,
        kind: mediaKindFilter,
        page: mediaPage,
        perPage: 20,
      });

      const items = result.data || [];
      const meta = result.meta || { total: 0, page: 1, perPage: 20, totalPages: 1 };
      mediaTotalPages = meta.totalPages;

      if (items.length === 0) {
        mediaUI.grid.innerHTML = '<div class="media-empty">Nenhum arquivo encontrado</div>';
      } else {
        mediaUI.grid.innerHTML = items.map((item) => renderMediaItem(item)).join('');
      }

      // Atualizar paginação
      mediaUI.pageInfo.textContent = `Página ${meta.page} de ${meta.totalPages}`;
      mediaUI.prevBtn.disabled = mediaPage <= 1;
      mediaUI.nextBtn.disabled = mediaPage >= mediaTotalPages;

      // Bind de eventos nos itens
      mediaUI.grid.querySelectorAll('.media-item').forEach((el) => {
        el.addEventListener('click', function () {
          const id = this.dataset.id;
          const item = items.find((i) => i.id === id);
          if (!item) return;

          // Selecionar/deselecionar
          if (window.__featuredMode) {
            // Modo seleção única
            mediaUI.grid.querySelectorAll('.media-item.selected').forEach((el2) => el2.classList.remove('selected'));
            selectedMedia = [item];
            this.classList.add('selected');
          } else {
            this.classList.toggle('selected');
            if (this.classList.contains('selected')) {
              if (!selectedMedia.find((s) => s.id === id)) {
                selectedMedia.push(item);
              }
            } else {
              selectedMedia = selectedMedia.filter((s) => s.id !== id);
            }
          }
        });

        // Duplo clique abre detalhes
        el.addEventListener('dblclick', function () {
          const id = this.dataset.id;
          showMediaDetail(id);
        });
      });

    } catch (error) {
      mediaUI.grid.innerHTML = `<div class="media-empty">Erro ao carregar: ${error.message}</div>`;
    }
  }

  function renderMediaItem(item) {
    const isSelected = selectedMedia.some((s) => s.id === item.id);
    const thumb = MediaAPI.getThumbnailUrl(item);
    const icon = MediaAPI.getMediaIcon(item.kind);
    const size = MediaAPI.formatFileSize(item.fileSize);

    let previewHtml = '';
    if (item.kind === 'image' && thumb) {
      previewHtml = `<img class="preview" src="${thumb}" alt="${item.altText || item.originalName}" loading="lazy">`;
    } else if (item.kind === 'video') {
      previewHtml = `<div class="preview-video">${icon}<span>${item.originalName}</span></div>`;
    } else if (item.kind === 'audio') {
      previewHtml = `<div class="preview-audio">${icon}<span>${item.originalName}</span></div>`;
    } else {
      previewHtml = `<div class="preview-document">${icon}<span>${item.originalName}</span></div>`;
    }

    return `
      <div class="media-item ${isSelected ? 'selected' : ''}" data-id="${item.id}" role="option" aria-selected="${isSelected}" tabindex="0">
        <div class="checkbox"></div>
        ${previewHtml}
        <div class="item-name">${item.originalName}</div>
      </div>
    `;
  }

  async function uploadFiles(files) {
    mediaUI.grid.innerHTML = '<div class="media-loading">Enviando arquivos...</div>';
    try {
      const results = await MediaAPI.upload(files);
      mediaPage = 1;
      await loadMediaGrid();
      // Selecionar os arquivos enviados
      results.forEach((item) => {
        const el = mediaUI.grid.querySelector(`[data-id="${item.id}"]`);
        if (el) {
          el.classList.add('selected');
          selectedMedia.push(item);
        }
      });
    } catch (error) {
      mediaUI.grid.innerHTML = `<div class="media-empty">Erro no upload: ${error.message}</div>`;
    }
  }

  async function showMediaDetail(id) {
    try {
      const media = await MediaAPI.getById(id);
      const size = MediaAPI.formatFileSize(media.fileSize);
      const icon = MediaAPI.getMediaIcon(media.kind);

      modals.mediaDetail.style.display = 'flex';
      $('#mediaDetailBody').innerHTML = `
        <div style="text-align:center;margin-bottom:1rem">
          ${media.kind === 'image' && media.fileUrl
            ? `<img src="${media.fileUrl}" alt="${media.originalName}" style="max-width:100%;max-height:200px;border-radius:8px">`
            : `<div style="width:64px;margin:0 auto">${icon}</div>`}
        </div>
        <table style="width:100%;font-size:.8125rem">
          <tr><td style="padding:.375rem;color:var(--color-gray-500)">Nome</td><td style="padding:.375rem">${media.originalName}</td></tr>
          <tr><td style="padding:.375rem;color:var(--color-gray-500)">Tipo</td><td style="padding:.375rem">${media.mimeType}</td></tr>
          <tr><td style="padding:.375rem;color:var(--color-gray-500)">Tamanho</td><td style="padding:.375rem">${size}</td></tr>
          ${media.width && media.height ? `<tr><td style="padding:.375rem;color:var(--color-gray-500)">Dimensões</td><td style="padding:.375rem">${media.width} × ${media.height}px</td></tr>` : ''}
          ${media.duration ? `<tr><td style="padding:.375rem;color:var(--color-gray-500)">Duração</td><td style="padding:.375rem">${media.duration}s</td></tr>` : ''}
          <tr><td style="padding:.375rem;color:var(--color-gray-500)">Data</td><td style="padding:.375rem">${formatDate(media.createdAt)}</td></tr>
        </table>
      `;
    } catch (error) {
      alert(`Erro ao carregar detalhes: ${error.message}`);
    }
  }

  /* ============================================
     INSERIR MÍDIA NO POST
     ============================================ */
  function insertSelectedMedia() {
    if (selectedMedia.length === 0) return;

    if (htmlMode) {
      // Modo HTML: inserir como código
      const html = selectedMedia.map((media) => mediaToHtml(media)).join('\n');
      const textarea = editor.textarea;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + html + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + html.length;
      textarea.focus();
    } else {
      // Modo visual: inserir no cursor
      selectedMedia.forEach((media) => {
        const html = mediaToHtml(media);
        if (media.kind === 'image' && selectedMedia.length > 1) {
          // Galeria
          insertHtml(`<figure data-media-id="${media.id}">${html}<figcaption>${media.caption || ''}</figcaption></figure>`);
        } else {
          insertHtml(html);
        }
      });
    }

    closeModal('mediaModal');
    selectedMedia = [];
    updateStats();
    markDirty();
  }

  function mediaToHtml(media) {
    const dataAttr = `data-media-id="${media.id}"`;

    switch (media.kind) {
      case 'image':
        return `<img src="${media.fileUrl}" alt="${media.altText || media.originalName}" title="${media.title || ''}" ${dataAttr} loading="lazy" style="max-width:100%;height:auto">`;
      case 'video':
        return `<video src="${media.fileUrl}" controls preload="metadata" ${dataAttr} style="max-width:100%"></video>`;
      case 'audio':
        return `<audio src="${media.fileUrl}" controls preload="metadata" ${dataAttr}></audio>`;
      default:
        return `<p><a href="${media.fileUrl}" download="${media.originalName}" ${dataAttr} target="_blank" rel="noopener">📄 ${media.originalName}</a></p>`;
    }
  }

  function insertHtml(html) {
    const sel = window.getSelection();
    if (!sel.rangeCount) {
      editor.content.focus();
      return;
    }

    const range = sel.getRangeAt(0);

    if (html.startsWith('<')) {
      const fragment = range.createContextualFragment(html);
      range.deleteContents();
      range.insertNode(fragment);
    } else {
      range.deleteContents();
      range.insertNode(document.createTextNode(html));
    }

    // Move cursor para o final
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    editor.content.focus();
  }

  /* ============================================
     DRAG & DROP NO EDITOR
     ============================================ */
  function setupEditorDrop() {
    editor.content.addEventListener('dragover', function (e) {
      e.preventDefault();
      this.style.outline = '2px dashed var(--color-primary)';
    });

    editor.content.addEventListener('dragleave', function () {
      this.style.outline = '';
    });

    editor.content.addEventListener('drop', function (e) {
      e.preventDefault();
      this.style.outline = '';

      if (e.dataTransfer.files.length) {
        // Upload direto
        uploadFiles(e.dataTransfer.files);
      } else if (e.dataTransfer.types.includes('text/html')) {
        const html = e.dataTransfer.getData('text/html');
        if (html) {
          insertHtml(html);
          markDirty();
        }
      }
    });
  }

  /* ============================================
     KEYBOARD SHORTCUTS
     ============================================ */
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
      // Ctrl+S = Salvar
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        savePost(false);
      }

      // Ctrl+Shift+P = Prévia
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        $('#btnPreview').click();
      }

      // Ctrl+K = Link (navegador usa Ctrl+K para busca, override)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openLinkModal();
      }

      // F11 = Fullscreen (navegador já usa)
    });
  }

  /* ============================================
     INICIALIZAÇÃO
     ============================================ */
  async function init() {
    // Carregar dados do post se houver ID na URL
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    if (postId) {
      await loadPost(postId);
    }

    // Configurar componentes
    setupToolbar();
    setupLinkModal();
    setupPreview();
    setupModals();
    setupHtmlMode();
    setupFullscreen();
    setupActionButtons();
    setupCategories();
    setupTags();
    setupFeaturedImage();
    setupMediaModal();
    setupEditorDrop();
    setupKeyboardShortcuts();

    // Slug automático
    editor.title.addEventListener('input', function () {
      updateSlug();
      markDirty();
    });

    // Slug manual
    $('#btnEditSlug').addEventListener('click', function () {
      editor.slug.dataset.auto = 'false';
      editor.slug.focus();
    });

    editor.slug.addEventListener('input', function () {
      editor.slugText.textContent = this.value || 'slug-do-post';
      markDirty();
    });

    // Conteúdo alterado
    editor.content.addEventListener('input', function () {
      updateStats();
      markDirty();
    });

    editor.content.addEventListener('paste', function (e) {
      // Sanitizar colagem para evitar HTML malicioso
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    });

    editor.content.addEventListener('drop', function (e) {
      e.preventDefault();
    });

    // Textarea mode
    editor.textarea.addEventListener('input', function () {
      markDirty();
    });

    // Auto-save

    // Auto-save
    startAutosave();

    // Atualizar estatísticas iniciais
    updateStats();

    // Foco no título
    editor.title.focus();

    console.log('✍️ Grafia Editor iniciado');
  }

  /* ============================================
     FUNÇÃO: LOAD POST (carregar post existente)
     ============================================ */
  async function loadPost(postId) {
    try {
      const token = getToken();
      const response = await fetch(`/api/posts/${postId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Post não encontrado');

      const post = await response.json();

      currentPostId = post.id;
      editor.title.value = post.title || '';
      editor.slug.value = post.slug || '';
      editor.slug.dataset.auto = 'false';
      editor.slugText.textContent = post.slug || 'slug-do-post';
      editor.status.value = post.status || 'draft';
      editor.excerpt.value = post.excerpt || '';
      editor.publishDate.value = post.publishedAt
        ? new Date(post.publishedAt).toISOString().slice(0, 16)
        : '';

      setContent(post.content || '');

      // Status indicator
      editor.statusIndicator.dataset.status = post.status || 'draft';
      editor.statusIndicator.textContent = {
        draft: 'Rascunho',
        published: 'Publicado',
        archived: 'Arquivado',
      }[post.status] || post.status;

      // Imagem destacada
      if (post.cover) {
        editor.featuredImg.src = post.cover;
        editor.featuredPreview.style.display = 'block';
        editor.featuredPlaceholder.style.display = 'none';
      }

      // Categorias
      if (post.categories) {
        post.categories.forEach((cat) => addCategoryTag(cat.id, cat.name));
      }

      // Tags
      if (post.tags) {
        post.tags.forEach((tag) => addTag(tag.name || tag));
      }

      isDirty = false;
      editor.lastSaved.textContent = `Último salvamento: ${formatDate(post.updatedAt)}`;

    } catch (error) {
      console.error('Erro ao carregar post:', error);
      alert(`Erro ao carregar post: ${error.message}`);
    }
  }

  // ============================================
  // INICIAR
  // ============================================
  document.addEventListener('DOMContentLoaded', function () {
    // Verificar autenticação
    const token = getToken();
    if (!token) {
      window.location.href = '/admin/login';
      return;
    }

    init();
  });

})();

