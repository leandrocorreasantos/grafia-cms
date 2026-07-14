import { Post } from '../../../src/domain/post/Post';
import { PostStatus } from '../../../src/domain/post/PostStatus';
import { v4 as uuidv4 } from 'uuid';
import { describe, expect, it } from '@jest/globals';

describe('Post - Entidade de Dominio', () => {
  const validData = {
    id: uuidv4(),
    title: 'Titulo do Post',
    cover: 'https://cdn.exemplo.com/capa.jpg',
    content: 'Conteudo do post com pelo menos 10 caracteres!',
    excerpt: 'Resumo do post',
    slug: 'titulo-do-post',
    status: PostStatus.DRAFT,
    authorId: uuidv4(),
    categoryIds: [uuidv4()],
    tagIds: [uuidv4(), uuidv4()],
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: undefined,
  };

  describe('criacao', () => {
    it('deve criar post com dados minimos', () => {
      const post = new Post(validData);
      expect(post.id).toBe(validData.id);
      expect(post.title).toBe(validData.title);
      expect(post.content).toBe(validData.content);
      expect(post.status).toBe(PostStatus.DRAFT);
    });

    it('deve lancar erro para titulo vazio', () => {
      expect(() => new Post({ ...validData, title: '' })).toThrow('3 characters');
    });

    it('deve lancar erro para titulo muito curto', () => {
      expect(() => new Post({ ...validData, title: 'ab' })).toThrow('3 characters');
    });

    it('deve lancar erro para conteudo muito curto', () => {
      expect(() => new Post({ ...validData, content: 'curto' })).toThrow('10 characters');
    });

    it('nao deve lancar erro para authorId vazio (sem validacao de authorId)', () => {
      expect(() => new Post({ ...validData, authorId: '' })).not.toThrow();
    });
  });

  describe('restore()', () => {
    it('deve restaurar post mantendo updatedAt original', () => {
      const oldDate = new Date('2020-01-01');
      const post = Post.restore({ ...validData, updatedAt: oldDate });
      expect(post.id).toBe(validData.id);
      expect(post.title).toBe(validData.title);
    });
  });

  describe('update()', () => {
    it('deve atualizar titulo e conteudo', () => {
      const post = new Post(validData);
      post.update('Novo Titulo', 'Novo conteudo com pelo menos 10 caracteres!');
      expect(post.title).toBe('Novo Titulo');
      expect(post.content).toBe('Novo conteudo com pelo menos 10 caracteres!');
    });

    it('deve atualizar cover quando informado', () => {
      const post = new Post(validData);
      post.update(validData.title, validData.content, 'https://cdn.exemplo.com/nova-capa.webp');
      expect(post.cover).toBe('https://cdn.exemplo.com/nova-capa.webp');
    });
  });

  describe('publish()', () => {
    it('deve publicar post em rascunho', () => {
      const post = new Post(validData);
      post.publish();
      expect(post.status).toBe(PostStatus.PUBLISHED);
    });

    it('nao deve alterar status se ja publicado', () => {
      const post = new Post({ ...validData, status: PostStatus.PUBLISHED });
      post.publish();
      expect(post.status).toBe(PostStatus.PUBLISHED);
    });
  });

  describe('updateAdvanced()', () => {
    it('deve atualizar apenas titulo parcialmente', () => {
      const post = new Post(validData);
      post.updateAdvanced({ title: 'Titulo Atualizado' });
      expect(post.title).toBe('Titulo Atualizado');
      expect(post.content).toBe(validData.content);
    });

    it('deve atualizar status para PUBLISHED', () => {
      const post = new Post(validData);
      post.updateAdvanced({ status: PostStatus.PUBLISHED });
      expect(post.status).toBe(PostStatus.PUBLISHED);
    });

    it('deve atualizar categoryIds e tagIds deduplicando', () => {
      const cat1 = uuidv4();
      const cat2 = uuidv4();
      const post = new Post(validData);
      post.updateAdvanced({ categoryIds: [cat1, cat1, cat2] });
      const json = post.toJSON();
      expect(json.categoryIds).toEqual([cat1, cat2]);
    });
  });

  describe('markTrash()', () => {
    it('deve marcar post como lixeira', () => {
      const post = new Post(validData);
      post.markTrash();
      expect(post.status).toBe(PostStatus.TRASH);
      expect(post.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('restoreFromTrash()', () => {
    it('deve restaurar post da lixeira para DRAFT', () => {
      const post = new Post(validData);
      post.markTrash();
      post.restoreFromTrash();
      expect(post.status).toBe(PostStatus.DRAFT);
      expect(post.deletedAt).toBeUndefined();
    });
  });

  describe('touchAutosave()', () => {
    it('deve atualizar autosaveAt', () => {
      const post = new Post(validData);
      const before = post.autosaveAt;
      post.touchAutosave();
      expect(post.autosaveAt).toBeInstanceOf(Date);
      if (before) {
        expect(post.autosaveAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      }
    });
  });

  describe('toJSON()', () => {
    it('deve retornar representacao JSON', () => {
      const post = new Post(validData);
      const json = post.toJSON();
      expect(json).toHaveProperty('id', validData.id);
      expect(json).toHaveProperty('title', validData.title);
      expect(json).toHaveProperty('content', validData.content);
      expect(json).toHaveProperty('status', PostStatus.DRAFT);
      expect(json).toHaveProperty('tagIds');
      expect(Array.isArray(json.tagIds)).toBe(true);
    });
  });
});
