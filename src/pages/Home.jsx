import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import WelcomeBanner from '../components/home/WelcomeBanner.jsx'
import HeroSection from '../components/home/HeroSection.jsx'
import CategorySection from '../components/home/CategorySection.jsx'
import TrendingTabsShowcase from '../components/home/TrendingTabsShowcase.jsx'
import WomensInnerwearShowcase from '../components/home/WomensInnerwearShowcase.jsx'
import OffersSection from '../components/home/OffersSection.jsx'
import WhyChooseUs from '../components/home/WhyChooseUs.jsx'
import Testimonials from '../components/home/Testimonials.jsx'
import Newsletter from '../components/home/Newsletter.jsx'

export default function Home() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showWelcome, setShowWelcome] = useState(Boolean(location.state?.welcome))

  // Consume the "welcome" flag out of router history state right away, so
  // reloading this page (same history entry) doesn't keep re-showing the
  // banner -- `showWelcome` (plain component state) is what actually
  // keeps it on screen for this visit.
  useEffect(() => {
    if (location.state?.welcome) {
      navigate(location.pathname, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      {showWelcome && (
        <WelcomeBanner
          name={user?.displayName?.split(' ')[0]}
          onDismiss={() => setShowWelcome(false)}
        />
      )}
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
