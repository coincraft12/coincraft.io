import Header from './Header'
import Footer from './Footer'

interface Props {
  title: string
  description?: string
}

export default function ComingSoon({ title, description }: Props) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary flex items-center justify-center pt-16">
        <div className="cc-container text-center py-32">
          <p className="cc-label mb-4">COMING SOON</p>
          <h1 className="text-4xl md:text-5xl font-bold text-cc-text mb-6">{title}</h1>
          {description && (
            <p className="text-cc-muted text-lg max-w-xl mx-auto mb-10">{description}</p>
          )}
          <a href="/" className="cc-btn cc-btn-ghost">← 홈으로</a>
        </div>
      </main>
      <Footer />
    </>
  )
}
