import HeroSection from '../components/home/HeroSection.jsx'
import CategorySection from '../components/home/CategorySection.jsx'
import TrendingTabsShowcase from '../components/home/TrendingTabsShowcase.jsx'
import WomensInnerwearShowcase from '../components/home/WomensInnerwearShowcase.jsx'
import OffersSection from '../components/home/OffersSection.jsx'
import WhyChooseUs from '../components/home/WhyChooseUs.jsx'
import Testimonials from '../components/home/Testimonials.jsx'
import Newsletter from '../components/home/Newsletter.jsx'

export default function Home() {
  return (
    <>
      <HeroSection />
      <CategorySection />
      <TrendingTabsShowcase />
      <WomensInnerwearShowcase />
      <OffersSection />
      <WhyChooseUs />
      <Testimonials />
      <Newsletter />
    </>
  )
}
