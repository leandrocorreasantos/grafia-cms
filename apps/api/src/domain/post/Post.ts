import { PostStatus } from './PostStatus';

export interface PostProps {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    slug: string;
    status: PostStatus;
    authorId: string;
    categoryIds: string[];
    tagIds: string[];
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
}

export class Post {
    private props: PostProps;

    constructor(props: Omit<PostProps, 'updatedAt'>) {
        this.props = {
            ...props,
            updatedAt: new Date(),
            excerpt: props.excerpt || this.generateExcerpt(props.content),
            slug: props.slug || this.generateSlug(props.title),
            status: props.status || PostStatus.DRAFT,
            categoryIds: props.categoryIds || [],
            tagIds: props.tagIds || []
        };
        this.validate();
    }

    /**
     * Restaura um Post a partir de dados persistidos no banco.
     * Difere do construtor pois preserva updatedAt original e não recalcula
     * excerpt/slug se já existirem.
     */
    static restore(props: PostProps): Post {
        const post = new Post(props);
        post.props.updatedAt = props.updatedAt;
        return post;
    }

    private validate(): void {
        if (!this.props.title || this.props.title.length < 3) {
            throw new Error('Title must have at least 3 characters');
        }
        if (!this.props.content || this.props.content.length < 10) {
            throw new Error('Content must have at least 10 characters');
        }
    }

    private generateExcerpt(content: string): string {
        return content.replace(/[#*`]/g, '').slice(0, 160) + '...';
    }

    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    public publish(): void {
        if (this.props.status === PostStatus.DRAFT) {
            this.props.status = PostStatus.PUBLISHED;
            this.props.publishedAt = new Date();
            this.props.updatedAt = new Date();
        }
    }

    public update(title: string, content: string): void {
        this.props.title = title;
        this.props.content = content;
        this.props.excerpt = this.generateExcerpt(content);
        this.props.slug = this.generateSlug(title);
        this.props.updatedAt = new Date();
        this.validate();
    }

    get id(): string { return this.props.id; }
    get title(): string { return this.props.title; }
    get content(): string { return this.props.content; }
    get excerpt(): string { return this.props.excerpt; }
    get slug(): string { return this.props.slug; }
    get status(): PostStatus { return this.props.status; }
    get authorId(): string { return this.props.authorId; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }
    get publishedAt(): Date | undefined { return this.props.publishedAt; }

    toJSON(): PostProps {
        return { ...this.props };
    }
}