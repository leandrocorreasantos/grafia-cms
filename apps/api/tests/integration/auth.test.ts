import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import { createTestApp, JWT_SECRET, seedAdmin } from '../helpers/test-utils';

/* ============================================
// SETUP
 ============================================ */

let prisma: PrismaClient;
let app: ReturnType<typeof createTestApp>;
let adminUser: any;
let adminToken: string;

/** Limpa todas as tabelas entre execucoes */
async function cleanDatabase() {
  await prisma.applicationPassword.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.user.deleteMany({});
}

beforeAll(async () => {
  prisma = new PrismaClient();
  app = createTestApp(prisma);
  await cleanDatabase();

  // Seed admin
  adminUser = await seedAdmin(prisma);
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
      expect(res.body.token.split('.')).toHaveLength(3); // JWT tem 3 partes

      // Salvar token para testar /me depois
      adminToken = res.body.token;
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
      // Criar Application Password para o admin
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
        .send({
          email: 'admin@teste.com',
          password: appPasswordValue,
          appName: 'TestApp',
        })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('type', 'application');
      expect(res.body.user.role).toBe('admin');
    });

    it('deve rejeitar Application Password com senha incorreta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@teste.com',
          password: 'senhaerrada',
          appName: 'TestApp',
        })
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });

    it('deve rejeitar Application Password com nome inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@teste.com',
          password: appPasswordValue,
          appName: 'AppInexistente',
        })
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
    const res = await request(app)
      .get('/api/auth/me')
      .expect(401);

    expect(res.body).toHaveProperty('error');
  });

  it('deve rejeitar token mal formatado', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'InvalidToken')
      .expect(401);

    expect(res.body).toHaveProperty('error');
  });

  it('deve rejeitar token expirado (ou invalido)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token.invalido.aqui')
      .expect(401);

    expect(res.body).toHaveProperty('error');
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

    // Verificar que o hash nunca e retornado
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
    // Primeiro listar para pegar o ID
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
    expect(res.body.message).toContain('sucesso');
  });

  it('deve retornar 404 ao revogar ID inexistente', async () => {
    const res = await request(app)
      .delete('/api/auth/app-passwords/id-inexistente')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    expect(res.body).toHaveProperty('error');
  });
});

// ============================================
// TESTES: Controle de Acesso por Cargo (Posts)
// ============================================

describe('Controle de Acesso por Cargo - Posts', () => {
  let authorToken: string;
  let editorToken: string;
  let authorUser: any;

  beforeAll(async () => {
    // Criar author
    authorUser = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'author-acesso@teste.com',
        name: 'Author Acesso',
        passwordHash: await bcrypt.hash('author123', 10),
        role: 'author',
      },
    });

    // Criar editor
    await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'editor-acesso@teste.com',
        name: 'Editor Acesso',
        passwordHash: await bcrypt.hash('editor123', 10),
        role: 'editor',
      },
    });

    // Fazer login para obter tokens
    const authorRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'author-acesso@teste.com', password: 'author123' });

    authorToken = authorRes.body.token;

    const editorRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'editor-acesso@teste.com', password: 'editor123' });

    editorToken = editorRes.body.token;
  });

  describe('GET /api/posts (publico)', () => {
    it('deve listar posts sem autenticacao', async () => {
      const res = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/posts (criar - exige author+)', () => {
    it('deve permitir que author crie post', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: 'Post do Author Teste',
          content: 'Conteudo do post com pelo menos 10 caracteres...',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Post do Author Teste');
    });

    it('deve rejeitar criacao sem token', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({
          title: 'Post sem token',
          content: 'Conteudo do post...',
        })
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/posts/:id (deletar - exige editor+)', () => {
    let postId: string;

    beforeAll(async () => {
      // Author cria um post
      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: 'Post para deletar',
          content: 'Conteudo do post para testar delecao...',
        });
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
      // Criar outro post para o teste
      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: 'Outro post',
          content: 'Conteudo do outro post...',
        });

      const res = await request(app)
        .delete(`/api/posts/${createRes.body.id}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .expect(403);

      expect(res.body).toHaveProperty('error');
      // Mensagem: "Apenas editores ou superiores podem remover posts"
      expect(res.body.error.toLowerCase()).toMatch(/editor|superior|restrito/);
    });
  });
});

// ============================================
// TESTES: Controle de Acesso por Cargo (Users)
// ============================================

describe('Controle de Acesso por Cargo - Users', () => {
  let contributorToken: string;

  beforeAll(async () => {
    // Criar usuário contributor
    await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'contrib@teste.com',
        name: 'Contribuidor',
        passwordHash: await bcrypt.hash('contrib123', 10),
        role: 'contributor',
      },
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'contrib@teste.com', password: 'contrib123' });

    contributorToken = loginRes.body.token;
  });

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
      const res = await request(app)
        .get('/api/users')
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });
  });
});

// ============================================
// TESTES: Health Check
// ============================================

describe('GET /api/health', () => {
  it('deve retornar status ok', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect(200);

    expect(res.body).toHaveProperty('status', 'ok');
  });
});
