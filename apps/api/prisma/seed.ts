import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Criar usuário admin
    const adminPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@grafia.com' },
        update: {},
        create: {
            email: 'admin@grafia.com',
            name: 'Admin Grafia',
            passwordHash: adminPassword,
            role: 'admin'
        }
    });

    console.log('✅ Usuário admin criado:', admin.email);

    // Criar post de exemplo
    const post = await prisma.post.create({
        data: {
            title: 'Bem-vindo ao Grafia CMS!',
            slug: 'bem-vindo-ao-grafia-cms',
            content: `
# Bem-vindo ao Grafia CMS 🚀

Grafia é um sistema de gerenciamento de conteúdo construído com TypeScript, 
seguindo princípios de DDD e Clean Architecture.

## Comece a escrever

Crie seu primeiro post clicando em "Novo Post" no menu lateral.

## Onde suas palavras ganham forma

Com o Grafia, você pode gerenciar blogs, sites institucionais, portfólios 
e muito mais.

---

*Grafia CMS - Onde suas palavras ganham forma.*
      `,
            excerpt: 'Bem-vindo ao Grafia CMS - O sistema de gerenciamento de conteúdo que une elegância e potência.',
            status: 'published',
            authorId: admin.id,
            publishedAt: new Date()
        }
    });

    console.log('✅ Post de exemplo criado:', post.title);
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });