import { Hero, PostsPreview } from '@/components/home'
import { Footer, Header } from '@/components/layout'

export default function HomePage() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <PostsPreview />
      </main>
      <Footer />
    </div>
  )
}
