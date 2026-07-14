import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '../../infrastructure/auth/JwtService';
import { authenticate } from '../middlewares/authMiddleware';

/**
 * Rotas de Categorias e Tags
 * Endpoints auxiliares para o editor WYSIWYG
 */
export function createCategoryRoutes(prisma: PrismaClient, jwtSecret: string): Router {
  const router = Router();
  const jwtService = new JwtService(jwtSecret);

  // GET /api/categories
  router.get('/', authenticate(jwtService), async (_req, res, next) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { postCategories: true } } },
      });
      res.json(categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        parentId: cat.parentId,
        postCount: cat._count.postCategories,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      })));
    } catch (error) {
      next(error);
    }
  });

  // POST /api/categories
  router.post('/', authenticate(jwtService), async (req, res, next) => {
    try {
      const { name, slug, description, parentId } = req.body;

      if (!name || name.trim().length < 2) {
        res.status(400).json({ error: 'Nome deve ter ao menos 2 caracteres' });
        return;
      }

      const finalSlug = slug || name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      const category = await prisma.category.create({
        data: {
          name: name.trim(),
          slug: finalSlug,
          description: description || '',
          parentId: parentId || undefined,
        },
      });

      res.status(201).json(category);
    } catch (error: any) {
      if (error.code === 'P2002') {
        res.status(409).json({ error: 'Já existe uma categoria com este slug' });
        return;
      }
      next(error);
    }
  });

  // DELETE /api/categories/:id
  router.delete('/:id', authenticate(jwtService), async (req, res, next) => {
    try {
      await prisma.category.delete({ where: { id: req.params.id } });
      res.json({ message: 'Categoria removida' });
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // TAGS
  // ============================================

  // GET /api/tags
  router.get('/tags', authenticate(jwtService), async (_req, res, next) => {
    try {
      const tags = await prisma.tag.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { postTags: true } } },
      });
      res.json(tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        postCount: tag._count.postTags,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
      })));
    } catch (error) {
      next(error);
    }
  });

  // POST /api/tags
  router.post('/tags', authenticate(jwtService), async (req, res, next) => {
    try {
      const { name } = req.body;

      if (!name || name.trim().length < 2) {
        res.status(400).json({ error: 'Nome deve ter ao menos 2 caracteres' });
        return;
      }

      const slug = name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      const tag = await prisma.tag.upsert({
        where: { slug },
        update: { name: name.trim() },
        create: { name: name.trim(), slug, description: '' },
      });

      res.status(201).json(tag);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
