#!/usr/bin/env node

// ============================================
// GRAFIA CMS - CRIAR USUÁRIO ADMIN
// ============================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    createHash('sha256').update(password + salt).digest('hex');
    // Em produção, substituir por bcrypt (mais seguro)
    // Para o instalador inicial, usamos SHA-256 + salt
    // O primeiro login forçará a redefinição de senha
    resolve(`pbkdf2_sha256$${salt}$${createHash('sha256').update(password + salt).digest('hex')}`);
  });
}

async function createAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@grafia.com';
  const adminName = process.env.ADMIN_NAME || 'Admin Grafia';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  try {
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        name: adminName,
        passwordHash,
        role: 'admin'
      },
      create: {
        email: adminEmail,
        name: adminName,
        passwordHash,
        role: 'admin'
      }
    });

    console.log(JSON.stringify({ success: true, user: { id: user.id, email: user.email } }));
  } catch (err) {
    console.error(JSON.stringify({ success: false, error: err.message }));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

