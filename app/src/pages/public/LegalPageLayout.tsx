interface Props {
  title: string
  effectiveDate?: string
  children: React.ReactNode
}

export function LegalPageLayout({ title, effectiveDate, children }: Props) {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-700">
      <article className="max-w-[800px] mx-auto px-6 py-12 md:py-16">
        <header className="mb-10 pb-6 border-b border-gray-200">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
          {effectiveDate && (
            <p className="mt-2 text-sm text-gray-500">Effective Date: {effectiveDate}</p>
          )}
        </header>

        <div className="space-y-8 text-[15px] leading-[1.75]">{children}</div>

        <footer className="mt-14 pt-8 border-t border-gray-200">
          <a
            href="https://unswpaksoc.com"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-green-600 transition-colors no-underline"
          >
            ← Back to Home
          </a>
        </footer>
      </article>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-3">{title}</h2>
      {children}
    </section>
  )
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <Section title={title}>{children}</Section>
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-2 marker:text-gray-400">
      {items.map(item => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export function LegalParagraph({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>
}
