import { useState } from 'react'
import { Play } from 'lucide-react'
import Reveal from '../common/Reveal.jsx'
import { Player, Thumb } from '../home/FactoryVideos.jsx'

// "See How We Work" section of the About Us page. Content comes from
// Admin -> About Us Page -> Videos (defaults in data/aboutDefaults.js).
// Videos can be YouTube links or files; an empty source shows "coming soon".
export default function AboutVideos({ content }) {
  const videos = (content?.items || []).filter((v) => v.active !== false)
  const [activeId, setActiveId] = useState(null)
  const [playingId, setPlayingId] = useState(null)
  const active = videos.find((v) => v.id === activeId) || videos[0]
  if (!active) return null

  const select = (id) => {
    setActiveId(id)
    setPlayingId(null)
  }

  return (
    <section className="section-py bg-cream">
      <div className="container-app">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <p className="eyebrow mb-2">{content.eyebrow}</p>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-ink">{content.title}</h2>
          {content.subtitle && <p className="text-ink-soft text-sm mt-3">{content.subtitle}</p>}
        </div>

        <div className="grid lg:grid-cols-[1.7fr_1fr] gap-5 lg:gap-6">
          <Reveal as="div" className="relative aspect-video overflow-hidden bg-black border border-thread shadow-[6px_6px_0_0_#1A1A1A]">
            <Player video={active} playing={playingId === active.id} onPlay={() => setPlayingId(active.id)} />
          </Reveal>

          <Reveal as="div" delay={100} className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:max-h-[30rem] pb-2 lg:pb-0 snap-x">
            {videos.map((v, i) => {
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
                    <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-brand mb-1">
                      {String(i + 1).padStart(2, '0')} · {v.tag}
                    </span>
                    <span className="block text-sm font-semibold leading-snug text-ink line-clamp-2">{v.title}</span>
                  </span>
                </button>
              )
            })}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
