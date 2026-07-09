import Link from 'next/link';

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_60px_rgba(31,27,22,0.06)] lg:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8c6b22]">Estrutura</p>
        <h1 className="mt-3 text-3xl font-semibold text-grafia-black">Categorias</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
          Espaço para organizar a hierarquia editorial que alimentará o futuro editor do conteúdo.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/admin" className="rounded-2xl border border-black/10 bg-white px-5 py-3 font-semibold text-grafia-black">
            Voltar ao painel
          </Link>
        </div>
      </section>

      <section className="rounded-[2rem] border border-dashed border-black/12 bg-[#fcfbf7] p-8 text-sm text-neutral-600">
        Hierarquia de categorias, contadores e filtros podem ser adicionados aqui.
      </section>
    </div>
  );
}
