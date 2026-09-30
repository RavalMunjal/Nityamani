import { Play, Sparkles } from 'lucide-react'

const SAMPLE_VIDEOS = [
  {
    id: 1,
    title: 'Natural 108 Sphatik Mani Beads Clarity & Cold Test',
    description: 'Direct showcase of pure quartz crystal malas under natural light showing genuine inclusions and cold touch.',
    duration: '1:45',
    thumbnail: 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 2,
    title: 'Peruvian Pyrite vs Golden Tiger Eye 8mm Bracelets',
    description: 'Bulk wholesale sorting and bead quality grade verification for retail jewelers and healing shops.',
    duration: '2:15',
    thumbnail: 'https://images.unsplash.com/photo-1611591475265-728b9d62d294?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 3,
    title: 'Authentic 5 Mukhi Nepali Rudraksha Wholesale Packets',
    description: 'Close-up mukhi line clarity, natural deep grooves and red tassel finish on factory stock.',
    duration: '3:10',
    thumbnail: 'https://images.unsplash.com/photo-1602928321679-560bb453f190?auto=format&fit=crop&w=600&q=80',
  },
]

export default function CustomerVideosPage() {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-display font-bold text-text-main">Wholesale Product Showcase</h1>
        <p className="text-sm text-text-muted">
          Live inspection videos from our warehouse to verify stone quality before bulk ordering
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SAMPLE_VIDEOS.map(vid => (
          <div key={vid.id} className="card-hover overflow-hidden flex flex-col group">
            <div className="relative aspect-video bg-text-main overflow-hidden">
              <img
                src={vid.thumbnail}
                alt={vid.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-brand-red text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 ml-0.5 fill-current" />
                </div>
              </div>
              <span className="absolute bottom-2 right-2 text-[11px] font-medium px-2 py-0.5 rounded bg-black/70 text-white">
                {vid.duration}
              </span>
            </div>

            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-main group-hover:text-brand-red transition-colors">
                  {vid.title}
                </h3>
                <p className="text-xs text-text-muted mt-1 line-clamp-2 leading-relaxed">
                  {vid.description}
                </p>
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center gap-1.5 text-xs text-brand-red font-medium">
                <Sparkles className="w-3.5 h-3.5" /> High Definition Warehouse Shoot
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
