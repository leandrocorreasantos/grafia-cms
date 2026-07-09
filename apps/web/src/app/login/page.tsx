'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRight, CheckCircle2, LockKeyhole, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextRoute, setNextRoute] = useState('/admin');

  useEffect(() => {
    const candidate = new URLSearchParams(window.location.search).get('next');
    if (candidate && candidate.startsWith('/')) {
      setNextRoute(candidate);
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      router.push(nextRoute);
    } catch {
      setError('Falha no login. Verifique email e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(201,168,76,0.22),_transparent_35%),linear-gradient(135deg,_#1b1713_0%,_#2a231d_42%,_#f4f1ea_42%,_#f4f1ea_100%)] px-4 py-6 text-grafia-black sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_30px_90px_rgba(31,27,22,0.18)] lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-[#1f1b16] p-8 text-white sm:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(201,168,76,0.2),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(196,26,26,0.28),_transparent_32%)]" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-[#f0e4c2]">
              <Sparkles className="h-4 w-4" />
              Painel editorial
            </p>
            <h1 className="mt-8 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
              Entre no centro de comando do conteúdo.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/72 sm:text-lg">
              Um ambiente inspirado em editores clássicos, com foco em clareza, velocidade e espaço para o futuro editor de texto.
            </p>
          </div>

          <div className="relative space-y-4">
            {[
              'Barra lateral para navegar rapidamente entre conteúdo e estrutura.',
              'Tela preparada para evoluir para editor visual sem refazer o layout.',
              'Fluxo de login simples, direto e com feedback claro.',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#c9a84c]" />
                <p className="text-sm leading-6 text-white/80">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center bg-[#f8f5ef] p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md rounded-[1.75rem] border border-black/8 bg-white p-6 shadow-[0_18px_60px_rgba(31,27,22,0.08)] sm:p-8">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#f1eadc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#8c6b22]">
                <LockKeyhole className="h-3.5 w-3.5" />
                Acesso restrito
              </div>
              <h2 className="mt-4 text-3xl font-semibold text-grafia-black">Entrar no painel</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                Use sua conta para acessar o menu lateral, o painel e as próximas ferramentas do editor.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-neutral-700">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="voce@dominio.com"
                  className="w-full rounded-2xl border border-black/10 bg-[#fcfbf7] px-4 py-3 text-grafia-black outline-none transition focus:border-[#c9a84c] focus:ring-4 focus:ring-[#c9a84c]/20"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-neutral-700">Senha</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-black/10 bg-[#fcfbf7] px-4 py-3 text-grafia-black outline-none transition focus:border-[#c9a84c] focus:ring-4 focus:ring-[#c9a84c]/20"
                />
              </div>

              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-grafia-red px-4 py-3 font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Entrando...' : 'Entrar no painel'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
