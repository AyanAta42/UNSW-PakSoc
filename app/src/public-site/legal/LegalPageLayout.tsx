import { AuroraPage } from '@/shared/components/AuroraPage'

interface Props {
  title:          string
  effectiveDate?: string
  children:       React.ReactNode
}

export function LegalPageLayout({ title, effectiveDate, children }: Props) {
  return (
    <AuroraPage className="font-sans" contentClassName="text-[#CBD5E1]">
      <article className="max-w-[800px] mx-auto px-6 py-12 md:py-16">
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo-round.png" alt="UNSW PakSoc" className="w-10 h-10 rounded-full object-cover shrink-0" />
          <div>
            <div className="font-bold text-sm text-[#F8FAFC] leading-tight">UNSW PakSoc</div>
            <div className="text-[10px] tracking-widest uppercase font-bold text-[#4ADE80]">Pakistani Society</div>
          </div>
        </div>
        <header className="mb-10 pb-6 border-b border-[#1D2129]">
          <h1 className="text-2xl md:text-3xl font-bold text-[#F8FAFC] tracking-tight">{title}</h1>
          {effectiveDate && <p className="mt-2 text-sm text-[#94A3B8]">Effective Date: {effectiveDate}</p>}
        </header>
        <div className="space-y-8 text-[15px] leading-[1.75]">{children}</div>
        <footer className="mt-14 pt-8 border-t border-[#1D2129]">
          <a href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F8FAFC] hover:text-[#4ADE80] transition-colors no-underline">← Back to Home</a>
        </footer>
      </article>
    </AuroraPage>
  )
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="text-lg font-bold text-[#F8FAFC] mb-3">{title}</h2>{children}</section>
}

export function LegalList({ items }: { items: string[] }) {
  return <ul className="list-disc pl-5 space-y-2 marker:text-[#64748B]">{items.map(item => <li key={item}>{item}</li>)}</ul>
}

export function LegalParagraph({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>
}
