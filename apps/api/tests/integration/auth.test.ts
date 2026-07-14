import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import { createTestApp, seedAdmin } from '../helpers/test-utils';

/* ============================================
// SETUP GLOBAL — inicializa tudo que os testes precisam
// para que qualquer describe ou it funcione independente.
// ============================================ */

let prisma: PrismaClient;
let app: ReturnType<typeof createTestApp>;
let adminUser: any;
/** Token de admin sempre disponível em todos os describes */
let adminToken: string;
/** Token de author criado no setup */
let authorToken: string;
/** Token de editor criado no setup */
let editorToken: string;
/** Token de contributor criado no setup */
let contributorToken: string;
/** ID do usuario author */
let authorUserId: string;

async function cleanDatabase() {
  await prisma.applicationPassword.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.user.deleteMany({});
}

async function createUserAndLogin(email: string, password: string, role: string) {
  const id = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { id, email, name: email.split('@')[0], passwordHash, role },
  });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return { user, token: loginRes.body.token || '' };
}

beforeAll(async () => {
  prisma = new PrismaClient();
  app = createTestApp(prisma);
  await cleanDatabase();

  // Admin
  adminUser = await seedAdmin(prisma);
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@teste.com', password: 'admin123' });
  adminToken = adminLogin.body.token || '';

  // Author
  const author = await createUserAndLogin('author-acesso@teste.com', 'author123', 'author');
  authorToken = author.token;
  authorUserId = author.user.id;

  // Editor
  const editor = await createUserAndLogin('editor-acesso@teste.com', 'editor123', 'editor');
  editorToken = editor.token;

  // Contributor
  const contributor = await createUserAndLogin('contrib@teste.com', 'contrib123', 'contributor');
  contributorToken = contributor.token;
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

// ============================================
// TESTES: POST /api/auth/login
// ============================================

describe('POST /api/auth/login', () => {
  describe('Login normal (email + senha)', () => {
    it('deve autenticar com credenciais validas e retornar token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@teste.com', password: 'admin123' })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('type', 'user');
      expect(res.body.user).toMatchObject({
        email: 'admin@teste.com',
        name: 'Admin Teste',
        role: 'admin',
      });
      expect(typeof res.body.token).toBe('string');
      expect(res.body.token.split('.')).toHaveLength(3);
    });

    it('deve rejeitar senha incorreta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@teste.com', password: 'senhaerrada' })
        .expect(401);

      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('invalido');
    });

    it('deve rejeitar email inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'naoexiste@teste.com', password: 'admin123' })
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });

    it('deve rejeitar email vazio', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: '', password: 'admin123' })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('deve rejeitar senha vazia', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@teste.com', password: '' })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('Login com Application Password', () => {
    let appPasswordValue: string;

    beforeAll(async () => {
      appPasswordValue = 'test-app-password-123';
      const passwordHash = await bcrypt.hash(appPasswordValue, 10);
      await prisma.applicationPassword.create({
        data: {
          userId: adminUser.id,
          name: 'TestApp',
          passwordHash,
        },
      });
    });

    afterAll(async () => {
      await prisma.applicationPassword.deleteMany({
        where: { userId: adminUser.id },
      });
    });

    it('deve autenticar com Application Password valida', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@teste.com', password: appPasswordValue, appName: 'TestApp' })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('type', 'application');
      expect(res.body.user.role).toBe('admin');
    });

    it('deve rejeitar Application Password com senha incorreta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@teste.com', password: 'senhaerrada', appName: 'TestApp' })
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });

    it('deve rejeitar Application Password com nome inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@teste.com', password: appPasswordValue, appName: 'AppInexistente' })
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });
  });
});

// ============================================
// TESTES: GET /api/auth/me
// ============================================

describe('GET /api/auth/me', () => {
  it('deve retornar dados do usuario com token valido', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toMatchObject({
      id: adminUser.id,
      email: 'admin@teste.com',
      role: 'admin',
      type: 'user',
    });
  });

  it('deve rejeitar acesso sem token', async () => {
    await request(app).get('/api/auth/me').expect(401);
  });

  it('deve rejeitar token mal formatado', async () => {
    await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'InvalidToken')
      .expect(401);
  });

  it('deve rejeitar token invalido', async () => {
    await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token.invalido.aqui')
      .expect(401);
  });
});

// ============================================
// TESTES: Application Passwords CRUD
// ============================================

describe('Application Passwords CRUD', () => {
  it('deve criar uma nova Application Password', async () => {
    const res = await request(app)
      .post('/api/auth/app-passwords')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'IntegracaoZapier' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('password');
    expect(res.body.name).toBe('IntegracaoZapier');
    expect(res.body.password.length).toBeGreaterThanOrEqual(20);
    expect(res.body).toHaveProperty('warning');
  });

  it('deve listar Application Passwords do usuario', async () => {
    const res = await request(app)
      .get('/api/auth/app-passwords')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);

    const appPwd = res.body.find((p: any) => p.name === 'IntegracaoZapier');
    expect(appPwd).toBeDefined();
    expect(appPwd).not.toHaveProperty('passwordHash');
  });

  it('deve rejeitar criacao com nome curto', async () => {
    const res = await request(app)
      .post('/api/auth/app-passwords')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'A' })
      .expect(400);

    expect(res.body).toHaveProperty('error');
  });

  it('deve rejeitar nome duplicado', async () => {
    const res = await request(app)
      .post('/api/auth/app-passwords')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'IntegracaoZapier' })
      .expect(409);

    expect(res.body).toHaveProperty('error');
  });

  it('deve revogar (deletar) uma Application Password', async () => {
    const listRes = await request(app)
      .get('/api/auth/app-passwords')
      .set('Authorization', `Bearer ${adminToken}`);

    const appPwd = listRes.body.find((p: any) => p.name === 'IntegracaoZapier');
    expect(appPwd).toBeDefined();

    const res = await request(app)
      .delete(`/api/auth/app-passwords/${appPwd.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('message');
  });

  it('deve retornar 404 ao revogar ID inexistente', async () => {
    const nonExistentId = uuidv4();
    const res = await request(app)
      .delete(`/api/auth/app-passwords/${nonExistentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    expect(res.body).toHaveProperty('error');
  });
});

// ============================================
// TESTES: Controle de Acesso por Cargo (Posts)
// ============================================

describe('Controle de Acesso por Cargo - Posts', () => {
  describe('GET /api/posts (publico)', () => {
    it('deve listar posts sem autenticacao', async () => {
      const res = await request(app).get('/api/posts').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('deve retornar somente posts publicados para usuarios anonimos', async () => {
      const draftRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ title: 'Rascunho Privado', content: 'Conteudo de rascunho que nao deve aparecer sem token', status: 'draft' })
        .expect(201);

      const publishedRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ title: 'Post Publicado', content: 'Conteudo publicado com mais de 10 caracteres', status: 'published' })
        .expect(201);

      const listRes = await request(app).get('/api/posts').expect(200);
      const ids = listRes.body.map((p: any) => p.id);
      expect(ids).toContain(publishedRes.body.id);
      expect(ids).not.toContain(draftRes.body.id);
    });
  });

  describe('GET /api/posts/:id (publico)', () => {
    it('deve negar acesso anonimo a rascunho e permitir para usuario autenticado', async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ title: 'Rascunho Oculto', content: 'Conteudo de rascunho para teste de acesso por id', status: 'draft' })
        .expect(201);

      await request(app).get(`/api/posts/${createRes.body.id}`).expect(404);

      const authRes = await request(app)
        .get(`/api/posts/${createRes.body.id}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .expect(200);

      expect(authRes.body.id).toBe(createRes.body.id);
      expect(authRes.body.status).toBe('draft');
    });
  });

  describe('POST /api/posts (criar - exige author+)', () => {
    it('deve permitir que author crie post', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ title: 'Post do Author Teste', content: 'Conteudo do post com pelo menos 10 caracteres...' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Post do Author Teste');
    });

    it('deve rejeitar criacao sem token', async () => {
      await request(app)
        .post('/api/posts')
        .send({ title: 'Post sem token', content: 'Conteudo do post...' })
        .expect(401);
    });
  });

  describe('DELETE /api/posts/:id (deletar - exige editor+)', () => {
    let postId: string;

    beforeAll(async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ title: 'Post para deletar', content: 'Conteudo do post para testar delecao...' });
      postId = createRes.body.id;
    });

    it('deve permitir que editor delete post', async () => {
      const res = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('message');
    });

    it('deve rejeitar delecao por author (cargo insuficiente)', async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ title: 'Outro post', content: 'Conteudo do outro post...' });

      const res = await request(app)
        .delete(`/api/posts/${createRes.body.id}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .expect(403);

      expect(res.body).toHaveProperty('error');
      expect(res.body.error.toLowerCase()).toMatch(/editor|superior|restrito/);
    });
  });
});

// ============================================
// TESTES: Controle de Acesso por Cargo (Users)
// ============================================

describe('Controle de Acesso por Cargo - Users', () => {
  describe('GET /api/users', () => {
    it('deve permitir admin listar usuarios', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('total');
    });

    it('deve negar acesso a contributor', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${contributorToken}`)
        .expect(403);

      expect(res.body).toHaveProperty('error');
    });

    it('deve negar acesso sem token', async () => {
      await request(app).get('/api/users').expect(401);
    });
  });
});

// ============================================
// TESTES: Health Check
// ============================================

describe('GET /api/health', () => {
  it('deve retornar status ok', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
