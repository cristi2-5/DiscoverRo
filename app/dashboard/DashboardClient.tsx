'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { deleteLocation } from '@/lib/actions/locations'

const AddLocationModal = dynamic(() => import('./AddLocationModal'), { ssr: false })

interface Location {
  id: string
  title: string | null
  description: string | null
  category: string | null
  cities: string[] | null
  images_urls: string[] | null
  is_published: boolean | null
  views_count: number | null
}

interface Profile {
  id: string
  full_name: string | null
  role: 'explorer' | 'merchant' | null
  trial_end_date: string | null
  is_premium: boolean | null
  email?: string
}

interface DashboardClientProps {
  initialLocations: Location[]
  profile: Profile
}

// ── Premium Badge ──────────────────────────────────────────────────────────
function PremiumBadge({ profile }: { profile: Profile }) {
  if (profile.is_premium) {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
        style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.15))', border: '1px solid rgba(251,191,36,0.4)', color: '#fbbf24' }}>
        <span>⭐</span>
        <span>Abonament Premium Activ</span>
      </div>
    )
  }

  if (profile.trial_end_date) {
    const end = new Date(profile.trial_end_date)
    const now = new Date()
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysLeft > 0) {
      return (
        <div className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.15))', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399' }}>
          <span>🟢</span>
          <span>Trial 30 zile — {daysLeft} {daysLeft === 1 ? 'zi rămasă' : 'zile rămase'}</span>
        </div>
      )
    }
  }

  // Expired / no plan
  return (
    <div className="inline-flex items-center gap-3 rounded-xl px-4 py-2 text-sm"
      style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.1))', border: '1px solid rgba(239,68,68,0.35)' }}>
      <span className="font-semibold text-red-400">⚠️ Abonament expirat</span>
      <button className="rounded-lg px-3 py-1 text-xs font-bold text-white"
        style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
        Upgrade acum
      </button>
    </div>
  )
}

// ── Location Card ──────────────────────────────────────────────────────────
function LocationCard({ location, onDelete }: { location: Location; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Ștergi "${location.title}"?`)) return
    setDeleting(true)
    await deleteLocation(location.id)
    onDelete()
    setDeleting(false)
  }

  const thumb = location.images_urls?.[0]

  return (
    <div className="rounded-2xl overflow-hidden transition-transform hover:-translate-y-0.5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Thumbnail */}
      <div className="relative h-40 bg-gray-800">
        {thumb
          ? <Image src={thumb} alt={location.title ?? ''} fill className="object-cover" referrerPolicy="no-referrer" unoptimized />
          : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl">
              {location.category === 'restaurant' ? '🍽️'
                : location.category === 'cazare' ? '🏨'
                : location.category === 'natura' ? '🌿'
                : location.category === 'muzeu' ? '🏛️'
                : '📍'}
            </div>
          )
        }
        {/* Category pill */}
        {location.category && (
          <span className="absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-xs font-medium text-white capitalize"
            style={{ background: 'rgba(99,102,241,0.8)', backdropFilter: 'blur(4px)' }}>
            {location.category === 'natura' ? 'Natură' : location.category === 'altul' ? 'Altele' : location.category}
          </span>
        )}
        {/* Published pill */}
        <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium ${location.is_published ? 'text-emerald-300' : 'text-amber-300'}`}
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          {location.is_published ? '● Publicat' : '● Draft'}
        </span>
        {/* Views count pill */}
        <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white shadow"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>
          <span className="text-[10px]">👁</span> {location.views_count || 0}
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-semibold text-white truncate">{location.title ?? 'Fără titlu'}</h3>
        {location.description && (
          <p className="text-gray-400 text-sm mt-1 line-clamp-2">{location.description}</p>
        )}
        {/* Cities */}
        {location.cities && location.cities.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {location.cities.slice(0, 3).map((c) => (
              <span key={c} className="rounded-full px-2 py-0.5 text-xs text-indigo-300"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
                {c}
              </span>
            ))}
            {location.cities.length > 3 && (
              <span className="text-xs text-gray-500">+{location.cities.length - 3}</span>
            )}
          </div>
        )}
        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="mt-3 w-full py-1.5 rounded-lg text-xs font-medium text-red-400 transition-colors hover:bg-red-900/20 disabled:opacity-50"
          style={{ border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {deleting ? '⏳ Se șterge...' : '🗑️ Șterge locația'}
        </button>
      </div>
    </div>
  )
}

// ── Main Client Component ──────────────────────────────────────────────────
export default function DashboardClient({ initialLocations, profile }: DashboardClientProps) {
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  const [showModal, setShowModal] = useState(false)

  async function refreshLocations() {
    // Close modal first, then re-fetch via a lightweight approach:
    // We'll reload the locations by calling the server action indirectly via router refresh.
    setShowModal(false)
    // Optimistic: re-fetch with import to avoid full page reload
    const { getMerchantLocations } = await import('@/lib/actions/locations')
    const fresh = await getMerchantLocations()
    setLocations(fresh as Location[])
  }

  return (
    <div className="min-h-screen pt-24 pb-10 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="mx-auto max-w-6xl">

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              👋 Bun venit, {profile.full_name || profile.email || 'Comerciant'}!
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Gestionează locațiile tale din DiscoverRo</p>
          </div>
          <PremiumBadge profile={profile} />
        </div>

        {/* Stats row - Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Locații totale', value: locations.length, icon: '📍', colSpan: 'md:col-span-2', bg: 'bg-white' },
            { label: 'Publicate', value: locations.filter((l) => l.is_published).length, icon: '✅', colSpan: 'col-span-1', bg: 'bg-white' },
            { label: 'Cu imagini', value: locations.filter((l) => l.images_urls && l.images_urls.length > 0).length, icon: '🖼️', colSpan: 'col-span-1', bg: 'bg-white' },
            { label: 'Vizualizări (total)', value: locations.reduce((sum, l) => sum + (l.views_count || 0), 0), icon: '👁️', colSpan: 'md:col-span-4', bg: 'bg-gradient-to-r from-teal-500/10 to-transparent' },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-2xl p-6 ${stat.colSpan} ${stat.bg} shadow-md border border-teal-100 flex flex-col justify-center transition-all hover:-translate-y-1 hover:shadow-lg hover:border-teal-300 hover:shadow-teal-500/10`}>
              <div className="flex items-center gap-4">
                <div className="text-4xl bg-teal-50 p-3 rounded-xl border border-teal-100">{stat.icon}</div>
                <div>
                  <div className="text-3xl font-extrabold text-slate-800">{stat.value}</div>
                  <div className="text-sm font-medium text-teal-600 mt-0.5 tracking-wide uppercase">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-5 rounded-2xl text-lg font-bold text-white mb-8 transition-all hover:scale-[1.01] active:scale-100 shadow-xl shadow-teal-500/20"
          style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)',
          }}
        >
          ＋ Adaugă Locație Nouă
        </button>

        {/* Locations Grid */}
        {locations.length === 0 ? (
          <div className="text-center py-20 rounded-2xl bg-white border border-slate-200">
            <div className="text-5xl mb-4">🗺️</div>
            <h2 className="text-xl font-semibold text-slate-800">Nicio locație adăugată încă</h2>
            <p className="text-slate-500 text-sm mt-2">Apasă butonul de mai sus pentru a adăuga prima ta locație!</p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Locațiile mele ({locations.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {locations.map((loc) => (
                <LocationCard
                  key={loc.id}
                  location={loc}
                  onDelete={() => setLocations((prev) => prev.filter((l) => l.id !== loc.id))}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <AddLocationModal
          onClose={() => setShowModal(false)}
          onCreated={refreshLocations}
        />
      )}
    </div>
  )
}
