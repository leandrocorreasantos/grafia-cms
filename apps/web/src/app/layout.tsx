import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Grafia CMS',
    description: 'Onde suas palavras ganham forma',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR">
            <body className={inter.className}>
                <main className="min-h-screen bg-gray-50">
                    {children}
                </main>
            </body>
        </html>
    );
}