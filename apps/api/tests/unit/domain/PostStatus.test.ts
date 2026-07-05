import { PostStatus } from '../../../src/domain/post/PostStatus';

describe('PostStatus - Value Object', () => {
  it('deve ter DRAFT como status padrao', () => {
    expect(PostStatus.DRAFT).toBe('draft');
  });

  it('deve ter PUBLISHED como status publicado', () => {
    expect(PostStatus.PUBLISHED).toBe('published');
  });

  it('deve ter ARCHIVED como status arquivado', () => {
    expect(PostStatus.ARCHIVED).toBe('archived');
  });
});
