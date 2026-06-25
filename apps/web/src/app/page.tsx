import Link from 'next/link';

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
            <div className="max-w-3xl text-center">
                <h1 className="text-6xl font-bold text-grafia-black mb-4">
                    ✍️ Grafia CMS
                </h1>
                <p className="text-2xl text-gray-600 mb-8">
                    Onde suas palavras ganham forma
                </p>
                <div className="flex gap-4 justify-center">
                    <Link
                        href="/admin"
                        className="bg-grafia-red text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
                    >
                        Acessar Admin
                    </Link>
                    <Link
                        href="/admin/posts/new"
                        className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
                    >
                        Criar Post
                    </Link>
                </div>
            </div>
        </div>
    );
}