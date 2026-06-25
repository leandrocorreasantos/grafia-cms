import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { PrismaPostRepository } from './infrastructure/repositories/PostRepository';
import { CreatePostUseCase } from './application/post/CreatePostUseCase';
import { GetPostsUseCase } from './application/post/GetPostsUseCase';

const app = express();
const prisma = new PrismaClient();
const postRepository = new PrismaPostRepository(prisma);

app.use(cors());
app.use(express.json());

// ROTAS
app.get('/api/posts', async (_req, res) => {
    const useCase = new GetPostsUseCase(postRepository);
    const posts = await useCase.execute();
    res.json(posts.map((post) => post.toJSON()));
});

app.post('/api/posts', async (req, res) => {
    try {
        const useCase = new CreatePostUseCase(postRepository);
        const post = await useCase.execute(req.body);
        res.status(201).json(post.toJSON());
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Grafia API rodando em http://localhost:${PORT}`);
});