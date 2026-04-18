import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'
import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'
import Tracks from '@/components/sections/Tracks'
import Academy from '@/components/sections/Academy'
import Patent from '@/components/sections/Patent'
import Community from '@/components/sections/Community'

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Tracks />
        <Academy />
        <Patent />
        <Community />
      </main>
      <Footer />
    </>
  )
}
