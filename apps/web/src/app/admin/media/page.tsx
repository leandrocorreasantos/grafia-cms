import Link from 'next/link';

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_60px_rgba(31,27,22,0.06)] lg:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8c6b22]">Biblioteca</p>
        <h1 className="mt-3 text-3xl font-semibold text-grafia-black">Mídia</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
          Área visual para uploads, biblioteca de imagens e anexos do conteúdo.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/admin" className="rounded-2xl border border-black/10 bg-white px-5 py-3 font-semibold text-grafia-black">
            Voltar ao painel
          </Link>
        </div>
      </section>

      <section className="rounded-[2rem] border border-dashed border-black/12 bg-[#fcfbf7] p-8 text-sm text-neutral-600">
        Grade de mídias, filtros e upload futuro podem ser inseridos aqui.
      </section>
    </div>
  );
}
