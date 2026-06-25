# 1. Navegar para a raiz do projeto
cd ../grafia-cms

# 2. Instalar dependências (do monorepo)
npm install

# 3. Subir o banco de dados (Docker)
npm run docker:up

# 4. Aguardar o PostgreSQL iniciar
sleep 5

# 5. Gerar o Prisma Client
npm run db:generate

# 6. Rodar as migrações
npm run db:migrate

# 7. Inserir dados iniciais (admin + post exemplo)
cd apps/api
npm run db:seed
cd ../..

# 8. Rodar o projeto em desenvolvimento
npm run dev

# 9. Acessar no navegador
# Web: http://localhost:3000
# API: http://localhost:3001
# Adminer (banco): http://localhost:8080