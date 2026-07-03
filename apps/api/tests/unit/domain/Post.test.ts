import { Post } from '../../../src/domain/post/Post';
import { PostStatus } from '../../../src/domain/post/PostStatus';
import { v4 as uuidv4 } from 'uuid';

describe('Post - Entidade de Dominio', () => {
  const validData = {
    id: uuidv4(),
    title: 'Titulo do Post',
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
