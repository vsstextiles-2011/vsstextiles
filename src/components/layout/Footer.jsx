import { Link } from 'react-router-dom'
import { Facebook, Instagram, Twitter, Youtube, Mail, MapPin, Phone, Briefcase } from 'lucide-react'
import logo from '../../assets/vss-logo.jpg'

export default function Footer() {
  return (
    <footer className="bg-ink text-cream/70">
      <div className="stitch-divider opacity-40" />
      <div className="container-app py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-0 lg:divide-x lg:divide-white/10">
        {/* Company */}
        <div className="lg:pr-8">
          <div className="flex items-center gap-2.5 mb-4">
            <img src={logo} alt="VSS Textiles" className="h-9 w-auto" />
          </div>
          <p className="text-sm text-cream/60 mb-4">
            A Pollachi-based knitwear manufacturer — our main production unit is right here, spun into a storefront selling quality basics for men, women, boys and girls, at prices every household can afford.
          </p>
          <div className="flex items-center gap-3">
            {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="social link"
                className="w-9 h-9 bg-white/10 hover:bg-brand flex items-center justify-center transition-colors"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="lg:px-8">
          <h4 className="eyebrow text-brand mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-brand transition-colors">Home</Link></li>
            <li><Link to="/shop" className="hover:text-brand transition-colors">Shop</Link></li>
            <li><Link to="/about" className="hover:text-brand transition-colors">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-brand transition-colors">Contact Us</Link></li>
            <li><Link to="/account" className="hover:text-brand transition-colors">My Account</Link></li>
          </ul>
        </div>

        {/* Categories */}
        <div className="lg:px-8">
          <h4 className="eyebrow text-brand mb-4">Categories</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/shop/men" className="hover:text-brand transition-colors">Men</Link></li>
            <li><Link to="/shop/women" className="hover:text-brand transition-colors">Women</Link></li>
            <li><Link to="/shop/boys" className="hover:text-brand transition-colors">Boys</Link></li>
            <li><Link to="/shop/girls" className="hover:text-brand transition-colors">Girls</Link></li>
            <li><Link to="/shop" className="hover:text-brand transition-colors">New Arrivals</Link></li>
            <li><Link to="/shop" className="hover:text-brand transition-colors">Best Sellers</Link></li>
          </ul>
        </div>

        {/* Customer Support */}
        <div className="lg:pl-8">
          <h4 className="eyebrow text-brand mb-4">Customer Support</h4>
          <ul className="space-y-3 text-sm font-mono">
            <li className="flex items-start gap-2">
              <Phone size={16} className="mt-0.5 shrink-0 text-brand" /> +91 98654 89201
            </li>
            <li className="flex items-start gap-2">
              <Mail size={16} className="mt-0.5 shrink-0 text-brand" /> vsstextiles07@gmail.com
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-brand" /> Pollachi, Tamil Nadu, India
            </li>
          </ul>

          <h4 className="eyebrow text-brand mt-6 mb-3">Business Enquiries</h4>
          <ul className="space-y-3 text-sm font-mono">
            <li className="flex items-start gap-2">
              <Briefcase size={16} className="mt-0.5 shrink-0 text-brand" /> 04259 - 222492
            </li>
            <li className="flex items-start gap-2">
              <Mail size={16} className="mt-0.5 shrink-0 text-brand" /> vsstextiles07@gmail.com
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-app py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-cream/50">
          <p>© {new Date().getFullYear()} VSS Textiles. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-brand transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-brand transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
