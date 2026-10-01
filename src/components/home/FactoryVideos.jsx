import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, ArrowRight, Clapperboard } from 'lucide-react'
import { useSiteContent } from '../../context/SiteContentContext.jsx'
import Reveal from '../common/Reveal.jsx'
import SectionHeading from '../common/SectionHeading.jsx'

// Pulls the id out of watch / youtu.be / shorts / embed links.
function youtubeId(url = '') {
  const m = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)
  return m ? m[1] : null
}

// Thumbnail: the uploaded poster, else the YouTube thumbnail, else nothing.
function posterOf(v) {
  if (v.poster) return v.poster
  const yt = youtubeId(v.src)
  return yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : ''
}

function Thumb({ video, className }) {
  const src = posterOf(video)
  return src ? (
    <img src={src} alt="" className={className} loading="lazy" />
  ) : (
    <span className={`${className} bg-ink block`} />
  )
}

function Player({ video, playing, onPlay }) {
  const yt = youtubeId(video.src)
  const hasVideo = Boolean(video.src)

  if (playing && hasVideo) {
    return yt ? (
      <iframe
        className="absolute inset-0 w-full h-full"
        src={`https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0`}
        title={video.title}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    ) : (
      <video className="absolute inset-0 w-full h-full bg-black" src={video.src} poster={posterOf(video) || undefined} controls autoPlay playsInline />
    )
  }

  return (
    <>
      <Thumb video={video} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
      {hasVideo ? (
        <button
          onClick={onPlay}
          aria-label={`Play video: ${video.title}`}
          className="absolute inset-0 flex items-center justify-center group"
        >
          <span className="relative flex items-center justify-center w-20 h-20 rounded-full bg-brand text-white shadow-2xl transition-transform group-hover:scale-110">
            <span className="absolute inset-0 rounded-full bg-brand/50 animate-ping" />
            <Play size={30} className="relative ml-1" fill="currentColor" />
          </span>
        </button>
      ) : (
        <span className="absolute top-4 right-4 flex items-center gap-1.5 bg-white text-ink font-mono text-[10px] uppercase tracking-wider px-3 py-1.5">
          <Clapperboard size={12} /> Video coming soon
        </span>
      )}
      <div className="absolute left-0 right-0 bottom-0 p-5 sm:p-7 pointer-events-none">
        <span className="inline-block bg-brand text-white font-mono text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 mb-3">
          {video.tag}
        </span>
        <h3 className="font-display text-xl sm:text-3xl font-semibold text-white mb-1.5">{video.title}</h3>
        <p className="text-white/80 text-sm max-w-xl hidden sm:block">{video.desc}</p>
      </div>
    </>
  )
}

export default function FactoryVideos() {
  // Edited from Admin -> Videos (Firestore siteContent/homeVideos).
  const { homeVideos } = useSiteContent()
  const [activeId, setActiveId] = useState(null)
  const [playingId, setPlayingId] = useState(null)
  const active = homeVideos.find((v) => v.id === activeId) || homeVideos[0]
  if (!active) return null

  const select = (id) => {
    setActiveId(id)
    setPlayingId(null)
  }

  return (
    <section className="section-py bg-cream-dark border-y border-thread">
      <div className="container-app">
        <SectionHeading
          eyebrow="Inside VSS Textiles"
          title="See How We Make It"
          subtitle="A look inside our factory and at the products we craft, from our floor to your wardrobe."
        />

        <div className="grid lg:grid-cols-[1.7fr_1fr] gap-5 lg:gap-6">
          <Reveal as="div" className="relative aspect-video overflow-hidden bg-black border border-thread shadow-[6px_6px_0_0_#1A1A1A]">
            <Player video={active} playing={playingId === active.id} onPlay={() => setPlayingId(active.id)} />
          </Reveal>

          <Reveal as="div" delay={100} className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 snap-x">
            {homeVideos.map((v) => {
              const isActive = v.id === active.id
              return (
                <button
                  key={v.id}
                  onClick={() => select(v.id)}
                  className={`snap-start shrink-0 w-64 lg:w-auto flex items-center gap-3.5 p-2.5 text-left border transition-colors ${
                    isActive ? 'border-brand bg-brand-light' : 'border-thread bg-white hover:border-ink/40'
                  }`}
                >
                  <span className="relative w-24 h-16 shrink-0 overflow-hidden bg-black">
                    <Thumb video={v} className="w-full h-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <span className={`flex items-center justify-center w-7 h-7 rounded-full ${isActive ? 'bg-brand' : 'bg-white/90'}`}>
                        <Play size={12} fill="currentColor" className={`ml-0.5 ${isActive ? 'text-white' : 'text-ink'}`} />
                      </span>
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-brand mb-1">{v.tag}</span>
                    <span className="block text-sm font-semibold leading-snug text-ink line-clamp-2">{v.title}</span>
                  </span>
                </button>
              )
            })}
            <Link
              to="/about"
              className="hidden lg:flex items-center justify-center gap-2 mt-auto bg-brand hover:bg-brand-dark text-white font-mono text-xs uppercase tracking-wider py-3.5 transition-colors"
            >
              Know More About Us <ArrowRight size={14} />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
