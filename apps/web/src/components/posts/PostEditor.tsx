'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiClient } from '@/lib/api';
import type {
  MediaItem,
  MediaListResponse,
  MediaUploadResponse,
  PostEditorPayload,
  PostItem,
  PostRevision,
  PostStatus,
} from '@/types';

type ToolbarState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
  insertOrderedList: boolean;
  insertUnorderedList: boolean;
};

type MediaInsertMode = 'insert' | 'cover';

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, ' ')
    .replace(/<script[^>]*>.*?<\/script>/gis, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function parseUuidList(raw: string): string[] {
  const matcher = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return raw.split(',').map((item) => item.trim()).filter((item) => matcher.test(item));
}

function generateMediaHtml(
  items: MediaItem[],
  options: {
    align: 'left' | 'center' | 'right';
    imageSize: 'thumbnail' | 'medium' | 'large' | 'full';
    caption: string;
    imageLink: string;
  },
): string {
  if (items.length > 1 && items.every((item) => item.kind === 'image')) {
    const galleryItems = items
      .map((item) => {
        const source = options.imageSize === 'full'
          ? item.fileUrl
          : item.thumbnails?.[options.imageSize] || item.fileUrl;

        return `<figure class="editor-gallery__item" data-media-id="${item.id}"><img src="${source}" alt="${item.altText || item.title || item.originalName}" loading="lazy"/></figure>`;
      })
      .join('');

    return `<div class="editor-gallery align-${options.align}" data-media-id="${items.map((item) => item.id).join(',')}">${galleryItems}</div><p></p>`;
  }

  return items
    .map((item) => {
      if (item.kind === 'image') {
        const source = options.imageSize === 'full'
          ? item.fileUrl
          : item.thumbnails?.[options.imageSize] || item.fileUrl;
        const image = `<img src="${source}" alt="${item.altText || item.title || item.originalName}" title="${item.title || item.originalName}" class="size-${options.imageSize} align-${options.align}" data-media-id="${item.id}" loading="lazy"/>`;
        const wrappedImage = options.imageLink
          ? `<a href="${options.imageLink}" target="_blank" rel="noopener noreferrer">${image}</a>`
          : image;
        const caption = options.caption || item.caption;
        return `<figure class="editor-figure align-${options.align}" data-media-id="${item.id}">${wrappedImage}${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure><p></p>`;
      }

      if (item.kind === 'video') {
        return `<figure class="editor-figure" data-media-id="${item.id}"><video controls preload="metadata" src="${item.fileUrl}"></video>${item.caption ? `<figcaption>${item.caption}</figcaption>` : ''}</figure><p></p>`;
      }

      if (item.kind === 'audio') {
        return `<figure class="editor-figure" data-media-id="${item.id}"><audio controls preload="metadata" src="${item.fileUrl}"></audio>${item.caption ? `<figcaption>${item.caption}</figcaption>` : ''}</figure><p></p>`;
      }

      return `<p><a href="${item.fileUrl}" data-media-id="${item.id}" target="_blank" rel="noopener noreferrer">📄 ${item.title || item.originalName}</a></p>`;
    })
    .join('');
}

function insertHtmlAtCursor(html: string) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const fragment = range.createContextualFragment(html);
  const lastNode = fragment.lastChild;
  range.insertNode(fragment);

  if (lastNode) {
    const newRange = document.createRange();
    newRange.setStartAfter(lastNode);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }
}

interface MediaLibraryModalProps {
  open: boolean;
  mode: MediaInsertMode;
  onClose: () => void;
  onInsert: (
    items: MediaItem[],
    options: {
      align: 'left' | 'center' | 'right';
      imageSize: 'thumbnail' | 'medium' | 'large' | 'full';
      caption: string;
      imageLink: string;
    },
  ) => void;
}

function MediaLibraryModal({ open, mode, onClose, onInsert }: MediaLibraryModalProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<'all' | MediaItem['kind']>('all');
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('center');
  const [imageSize, setImageSize] = useState<'thumbnail' | 'medium' | 'large' | 'full'>('large');
  const [caption, setCaption] = useState('');
  const [imageLink, setImageLink] = useState('');

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, page, search, kind]);

  async function load() {
    const params = new URLSearchParams({
      page: String(page),
      perPage: '24',
      status: 'active',
      kind,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    if (search.trim()) params.set('search', search.trim());
    const response = await api.get<MediaListResponse>(`/api/media?${params.toString()}`);
    setItems(response.data);
    setTotalPages(response.meta.totalPages || 1);
    setSelectedIds((current) => current.filter((id) => response.data.some((item) => item.id === id)));
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));
    await apiClient.post<MediaUploadResponse>('/api/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await load();
  }

  if (!open) return null;
  const selectedItems = items.filter((item) => selectedIds.includes(item.id));

  return (
    <div className="media-modal-backdrop" role="presentation">
      <section className="media-modal media-modal--preview" role="dialog" aria-modal="true" aria-label="Biblioteca de mídia">
        <header className="media-modal__header">
          <h2>{mode === 'cover' ? 'Selecionar imagem destacada' : 'Biblioteca de mídia'}</h2>
          <button type="button" className="media-icon-button" onClick={onClose}>Fechar</button>
        </header>

        <div className="editor-media-modal__filters">
          <input className="media-input" placeholder="Buscar mídia" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          <select className="media-select" value={kind} onChange={(event) => { setKind(event.target.value as any); setPage(1); }}>
            <option value="all">Todos</option>
            <option value="image">Imagens</option>
            <option value="video">Vídeos</option>
            <option value="audio">Áudios</option>
            <option value="document">Documentos</option>
          </select>
          <label className="media-button">
            Upload direto
            <input className="visually-hidden" type="file" multiple onChange={(event) => void uploadFiles(event.target.files)} />
          </label>
        </div>

        <div className="editor-media-modal__body">
          <div className="editor-media-modal__grid" role="listbox" aria-label="Arquivos de mídia">
            {items.map((item) => (
              <label key={item.id} className={`editor-media-item ${selectedIds.includes(item.id) ? 'is-selected' : ''}`}>
                <input
                  type={mode === 'cover' ? 'radio' : 'checkbox'}
                  name="editor-media-select"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => {
                    if (mode === 'cover') {
                      setSelectedIds([item.id]);
                      return;
                    }

                    setSelectedIds((current) => (current.includes(item.id)
                      ? current.filter((id) => id !== item.id)
                      : [...current, item.id]));
                  }}
                />
                <div className="editor-media-item__preview">
                  {item.kind === 'image' ? <img src={item.thumbnails?.thumbnail || item.fileUrl} alt={item.altText || item.originalName} /> : <span>{item.fileExtension.toUpperCase()}</span>}
                </div>
                <small>{item.title || item.originalName}</small>
              </label>
            ))}
          </div>

          <aside className="editor-media-modal__sidebar">
            <h3>Opções de inserção</h3>
            <label>
              <span>Alinhamento</span>
              <select className="media-select" value={align} onChange={(event) => setAlign(event.target.value as any)}>
                <option value="left">Esquerda</option>
                <option value="center">Centro</option>
                <option value="right">Direita</option>
              </select>
            </label>
            <label>
              <span>Tamanho</span>
              <select className="media-select" value={imageSize} onChange={(event) => setImageSize(event.target.value as any)}>
                <option value="thumbnail">Thumbnail</option>
                <option value="medium">Médio</option>
                <option value="large">Grande</option>
                <option value="full">Original</option>
              </select>
            </label>
            <label>
              <span>Legenda</span>
              <input className="media-input" value={caption} onChange={(event) => setCaption(event.target.value)} />
            </label>
            <label>
              <span>Transformar imagem em link</span>
              <input className="media-input" value={imageLink} onChange={(event) => setImageLink(event.target.value)} placeholder="https://..." />
            </label>

            <small>{selectedIds.length} selecionado(s)</small>
          </aside>
        </div>

        <footer className="media-modal__footer">
          <div className="media-toolbar__actions">
            <button type="button" className="media-button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Anterior</button>
            <span>Página {page} de {totalPages}</span>
            <button type="button" className="media-button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</button>
          </div>
          <button
            type="button"
            className="media-button media-button--primary"
            disabled={selectedItems.length === 0}
            onClick={() => onInsert(selectedItems, { align, imageSize, caption, imageLink })}
          >
            Inserir selecionados
          </button>
        </footer>
      </section>
    </div>
  );
}

interface PostEditorProps {
  postId?: string;
}

export function PostEditor({ postId }: PostEditorProps) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [cover, setCover] = useState('');
  const [status, setStatus] = useState<PostStatus>('draft');
  const [type, setType] = useState('post');
  const [categoryIdsRaw, setCategoryIdsRaw] = useState('');
  const [tagIdsRaw, setTagIdsRaw] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [content, setContent] = useState('<p></p>');
  const [htmlMode, setHtmlMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [toolbarState, setToolbarState] = useState<ToolbarState>({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertOrderedList: false,
    insertUnorderedList: false,
  });
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(!!postId);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaMode, setMediaMode] = useState<MediaInsertMode>('insert');
  const [revisions, setRevisions] = useState<PostRevision[]>([]);

  useEffect(() => {
    if (!postId) return;
    void loadPost(postId);
    void loadRevisions(postId);
  }, [postId]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  useEffect(() => {
    const handler = () => {
      try {
        setToolbarState({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          strikeThrough: document.queryCommandState('strikeThrough'),
          insertOrderedList: document.queryCommandState('insertOrderedList'),
          insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        });
      } catch {
      }
    };

    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, []);

  useEffect(() => {
    if (!postId || !dirty) return;

    const timer = window.setInterval(() => {
      void autosave();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [postId, dirty, title, content, status, cover, excerpt, slug, type, scheduledAt]);

  async function loadPost(id: string) {
    setLoading(true);
    try {
      const post = await api.get<PostItem>(`/api/posts/${id}`);
      setTitle(post.title);
      setSlug(post.slug);
      setExcerpt(post.excerpt || '');
      setCover(post.cover || '');
      setStatus(post.status);
      setType(post.type || 'post');
      setScheduledAt(post.scheduledAt ? post.scheduledAt.slice(0, 16) : '');
      setContent(post.content || '<p></p>');
      setCategoryIdsRaw(post.categoryIds.join(','));
      setTagIdsRaw(post.tagIds.join(','));
      setDirty(false);
    } finally {
      setLoading(false);
    }
  }

  async function loadRevisions(id: string) {
    const data = await api.get<PostRevision[]>(`/api/posts/${id}/revisions?limit=10`);
    setRevisions(data);
  }

  function markDirty() {
    setDirty(true);
    setSavingState('idle');
  }

  function getPayload(nextStatus: PostStatus): PostEditorPayload {
    return {
      title,
      slug: slug || toSlug(title),
      excerpt,
      content,
      cover: cover || undefined,
      status: nextStatus,
      type,
      scheduledAt: scheduledAt || undefined,
      categoryIds: parseUuidList(categoryIdsRaw),
      tagIds: parseUuidList(tagIdsRaw),
    };
  }

  async function save(nextStatus: PostStatus) {
    setSavingState('saving');
    const payload = getPayload(nextStatus);

    if (postId) {
      const updated = await api.put<PostItem>(`/api/posts/${postId}`, payload);
      setStatus(updated.status);
      setDirty(false);
      setSavingState('saved');
      await loadRevisions(postId);
      return;
    }

    const created = await api.post<PostItem>('/api/posts', payload);
    setSavingState('saved');
    setDirty(false);
    router.replace(`/admin/posts/${created.id}/edit`);
  }

  async function autosave() {
    if (!postId || !dirty) return;
    setSavingState('saving');
    await api.put(`/api/posts/${postId}/autosave`, getPayload(status));
    setSavingState('saved');
    setDirty(false);
  }

  function command(name: string, value?: string) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(name, false, value);
    setContent(editorRef.current.innerHTML);
    markDirty();
  }

  function handleInsertMedia(
    items: MediaItem[],
    options: {
      align: 'left' | 'center' | 'right';
      imageSize: 'thumbnail' | 'medium' | 'large' | 'full';
      caption: string;
      imageLink: string;
    },
  ) {
    if (mediaMode === 'cover') {
      const firstImage = items.find((item) => item.kind === 'image') || items[0];
      if (firstImage) {
        setCover(firstImage.fileUrl);
        markDirty();
      }
      setMediaOpen(false);
      return;
    }

    insertHtmlAtCursor(generateMediaHtml(items, options));
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
      markDirty();
    }
    setMediaOpen(false);
  }

  async function uploadDroppedFiles(files: FileList) {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));
    const response = await apiClient.post<MediaUploadResponse>('/api/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    handleInsertMedia(response.data.data, {
      align: 'center',
      imageSize: 'large',
      caption: '',
      imageLink: '',
    });
  }

  const counters = useMemo(() => {
    const plain = stripHtml(content);
    return {
      words: plain ? plain.split(' ').length : 0,
      chars: plain.length,
      images: (content.match(/<img\b/gi) || []).length,
      links: (content.match(/<a\b/gi) || []).length,
    };
  }, [content]);

  if (loading) {
    return <div className="media-empty-state">Carregando editor...</div>;
  }

  return (
    <div className={`wysiwyg-shell ${fullscreen ? 'is-fullscreen' : ''}`}>
      <header className="wysiwyg-topbar">
        <div className="wysiwyg-topbar__title">
          <label>
            <span>Título do post</span>
            <input
              className="media-input"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (!slug) setSlug(toSlug(event.target.value));
                markDirty();
              }}
              placeholder="Digite um título forte"
            />
          </label>
          <small>
            Status: <strong>{status}</strong> • {savingState === 'saving' ? 'salvando...' : savingState === 'saved' ? 'salvo' : 'alterações pendentes'}
          </small>
        </div>

        <div className="wysiwyg-topbar__actions">
          <button type="button" className="media-button" onClick={() => setShowPreview((current) => !current)}>{showPreview ? 'Ocultar prévia' : 'Pré-visualizar'}</button>
          <button type="button" className="media-button" onClick={() => void save('draft')}>Salvar rascunho</button>
          <button type="button" className="media-button media-button--primary" onClick={() => void save('published')}>Publicar</button>
        </div>
      </header>

      <div className="wysiwyg-toolbar" role="toolbar" aria-label="Barra de ferramentas do editor">
        <button type="button" aria-label="Negrito" className={toolbarState.bold ? 'is-active' : ''} onClick={() => command('bold')}>B</button>
        <button type="button" aria-label="Itálico" className={toolbarState.italic ? 'is-active' : ''} onClick={() => command('italic')}><em>I</em></button>
        <button type="button" aria-label="Sublinhado" className={toolbarState.underline ? 'is-active' : ''} onClick={() => command('underline')}><u>U</u></button>
        <button type="button" aria-label="Tachado" className={toolbarState.strikeThrough ? 'is-active' : ''} onClick={() => command('strikeThrough')}><s>S</s></button>
        <span className="sep" />
        <button type="button" onClick={() => command('justifyLeft')}>⟸</button>
        <button type="button" onClick={() => command('justifyCenter')}>≡</button>
        <button type="button" onClick={() => command('justifyRight')}>⟹</button>
        <button type="button" onClick={() => command('justifyFull')}>☰</button>
        <span className="sep" />
        <button type="button" className={toolbarState.insertUnorderedList ? 'is-active' : ''} onClick={() => command('insertUnorderedList')}>• Lista</button>
        <button type="button" className={toolbarState.insertOrderedList ? 'is-active' : ''} onClick={() => command('insertOrderedList')}>1. Lista</button>
        <button type="button" onClick={() => command('formatBlock', 'blockquote')}>Citação</button>
        <button type="button" onClick={() => command('formatBlock', 'pre')}>Código</button>
        <span className="sep" />
        <select className="media-select" onChange={(event) => command('formatBlock', event.target.value)} defaultValue="p" aria-label="Nível do título">
          <option value="p">Parágrafo</option>
          <option value="h1">H1</option>
          <option value="h2">H2</option>
          <option value="h3">H3</option>
          <option value="h4">H4</option>
          <option value="h5">H5</option>
          <option value="h6">H6</option>
        </select>
        <select className="media-select" onChange={(event) => command('fontSize', event.target.value)} defaultValue="3" aria-label="Tamanho da fonte">
          <option value="2">Pequena</option>
          <option value="3">Normal</option>
          <option value="4">Média</option>
          <option value="5">Grande</option>
        </select>
        <input type="color" title="Cor do texto" onChange={(event) => command('foreColor', event.target.value)} />
        <input type="color" title="Cor de fundo" onChange={(event) => command('hiliteColor', event.target.value)} />
        <span className="sep" />
        <button type="button" onClick={() => {
          const url = window.prompt('URL do link:');
          if (!url) return;
          command('createLink', url);
        }}>Link</button>
        <button type="button" onClick={() => command('unlink')}>Remover link</button>
        <button type="button" onClick={() => command('undo')}>Desfazer</button>
        <button type="button" onClick={() => command('redo')}>Refazer</button>
        <span className="sep" />
        <button type="button" className="media-button media-button--primary" onClick={() => { setMediaMode('insert'); setMediaOpen(true); }}>Inserir mídia</button>
        <button type="button" onClick={() => setHtmlMode((current) => !current)}>{htmlMode ? 'Modo visual' : 'Modo HTML'}</button>
        <button type="button" onClick={() => setFullscreen((current) => !current)}>{fullscreen ? 'Sair tela cheia' : 'Tela cheia'}</button>
      </div>

      <div className={`wysiwyg-layout ${showPreview ? 'has-preview' : ''}`}>
        <section className="wysiwyg-editor-column">
          {htmlMode ? (
            <textarea className="wysiwyg-html" value={content} onChange={(event) => { setContent(event.target.value); markDirty(); }} aria-label="Edição HTML" />
          ) : (
            <div
              ref={editorRef}
              className="wysiwyg-editor"
              contentEditable
              suppressContentEditableWarning
              onInput={(event) => {
                setContent((event.target as HTMLDivElement).innerHTML);
                markDirty();
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (event.dataTransfer.files?.length) {
                  void uploadDroppedFiles(event.dataTransfer.files);
                }
              }}
              onDragOver={(event) => event.preventDefault()}
              role="textbox"
              aria-label="Conteúdo do post"
            />
          )}

          <footer className="wysiwyg-footer">
            <span>{counters.words} palavras</span>
            <span>{counters.chars} caracteres</span>
            <span>{counters.images} imagens</span>
            <span>{counters.links} links</span>
            <button type="button" className="media-button" onClick={() => { command('removeFormat'); command('unlink'); }}>Limpar formatação</button>
          </footer>
        </section>

        {showPreview && (
          <aside className="wysiwyg-preview" aria-live="polite">
            <h3>Prévia em tempo real</h3>
            <article dangerouslySetInnerHTML={{ __html: content }} />
          </aside>
        )}

        <aside className="wysiwyg-sidebar">
          <label>
            <span>Slug</span>
            <input className="media-input" value={slug} onChange={(event) => { setSlug(event.target.value); markDirty(); }} />
          </label>
          <label>
            <span>Resumo</span>
            <textarea className="media-textarea" value={excerpt} onChange={(event) => { setExcerpt(event.target.value); markDirty(); }} />
          </label>
          <label>
            <span>Status</span>
            <select className="media-select" value={status} onChange={(event) => { setStatus(event.target.value as PostStatus); markDirty(); }}>
              <option value="draft">Rascunho</option>
              <option value="pending">Pendente</option>
              <option value="published">Publicado</option>
              <option value="archived">Arquivado</option>
            </select>
          </label>
          <label>
            <span>Tipo</span>
            <input className="media-input" value={type} onChange={(event) => { setType(event.target.value || 'post'); markDirty(); }} />
          </label>
          <label>
            <span>Publicação programada</span>
            <input type="datetime-local" className="media-input" value={scheduledAt} onChange={(event) => { setScheduledAt(event.target.value); markDirty(); }} />
          </label>
          <label>
            <span>Imagem destacada</span>
            {cover ? <img src={cover} alt="Capa" className="wysiwyg-cover-preview" /> : <small>Nenhuma capa definida</small>}
            <div className="media-toolbar__actions">
              <button type="button" className="media-button" onClick={() => { setMediaMode('cover'); setMediaOpen(true); }}>Definir capa</button>
              <button type="button" className="media-button" onClick={() => { setCover(''); markDirty(); }}>Remover</button>
            </div>
          </label>
          <label>
            <span>Categorias (UUIDs)</span>
            <input className="media-input" value={categoryIdsRaw} onChange={(event) => { setCategoryIdsRaw(event.target.value); markDirty(); }} placeholder="id1,id2,id3" />
          </label>
          <label>
            <span>Tags (UUIDs)</span>
            <input className="media-input" value={tagIdsRaw} onChange={(event) => { setTagIdsRaw(event.target.value); markDirty(); }} placeholder="id1,id2,id3" />
          </label>

          {!!postId && (
            <section className="wysiwyg-revisions">
              <h4>Revisões</h4>
              {revisions.length === 0 ? <small>Sem revisões ainda.</small> : (
                <ul>
                  {revisions.map((revision) => (
                    <li key={revision.id}>
                      <strong>{new Date(revision.createdAt).toLocaleString('pt-BR')}</strong>
                      <span>{revision.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </aside>
      </div>

      <MediaLibraryModal open={mediaOpen} mode={mediaMode} onClose={() => setMediaOpen(false)} onInsert={handleInsertMedia} />
    </div>
  );
}
