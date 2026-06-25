export type UserRole = 'admin' | 'editor' | 'author';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}