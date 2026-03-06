'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/utils/supabase/client'
import { getMerchantLocations } from '@/lib/actions/locations'

// Dynamically import MapPicker to avoid SSR issues with Leaflet
const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false })

const CATEGORIES = [
  'Restaurant',
  'Cafenea',
  'Cazare',
  'Atracție turistică',
  'Natură',
  'Muzeu',
  'Parc',
  'Cumpărături',
  'Altele',
]

interface AddLocationModalProps {
  onClose: () => void
  onCreated: () => void
}

export default function AddLocationModal({ onClose, onCreated }: AddLocationModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [cities, setCities] = useState<string[]>([])
  const [cityInput, setCityInput] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Cities tag input ──────────────────────────────────────────────────────
  function handleCityKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && cityInput.trim()) {
      e.preventDefault()
      const normalized = cityInput.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (!cities.includes(normalized)) {
        setCities((prev) => [...prev, normalized])
      }
      setCityInput('')
    }
  }

  function removeCity(city: string) {
    setCities((prev) => prev.filter((c) => c !== city))
  }

  // ── Image handling ────────────────────────────────────────────────────────
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setImageFiles((prev) => [...prev, ...files])
    const previews = files.map((f) => URL.createObjectURL(f))
    setImagePreviews((prev) => [...prev, ...previews])
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim()) { setError('Titlul este obligatoriu.'); return }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Neautentificat.'); setLoading(false); return }

      let finalLat = lat
      let finalLng = lng

      if (!lat || !lng) {
        if (address.trim() || cities.length > 0) {
          try {
            const { getCoordsFromAddress } = await import('@/lib/actions/geocoding')
            const searchStr = address.trim() ? address.trim() : cities[0] + ', Romania'
            const coords = await getCoordsFromAddress(searchStr)
            if (coords) {
              finalLat = coords.lat
              finalLng = coords.lon
            }
          } catch (e) {
            console.error('Geocoding error:', e)
          }
        }
      }

      // 1. Upload images
      const imageUrls: string[] = []
      for (const file of imageFiles) {
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('location-images')
          .upload(path, file, { upsert: false })
        if (uploadError) {
          console.error('Upload error:', uploadError)
          setError(`Eroare încărcare imagine (${file.name}): ${uploadError.message}. Ai permisiuni în Storage (RLS)?`)
          setLoading(false)
          return
        }
        const { data: urlData } = supabase.storage.from('location-images').getPublicUrl(path)
        imageUrls.push(urlData.publicUrl)
      }

      // 2. Build WKT point
      const locationPoint = finalLat !== null && finalLng !== null ? `POINT(${finalLng} ${finalLat})` : null

      // Map UI category to DB allowed enums (check constraint)
      let dbCategory = 'altul'
      if (category === 'Restaurant' || category === 'Cafenea') dbCategory = 'restaurant'
      else if (category === 'Cazare') dbCategory = 'cazare'
      else if (category === 'Natură' || category === 'Parc') dbCategory = 'natura'
      else if (category === 'Muzeu') dbCategory = 'muzeu'

      // 3. Insert location
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from('locations')
        .insert({
          owner_id: user.id,
          title: title.trim(),
          description: description.trim(),
          category: dbCategory,
          address: address.trim() || null,
          cities,
          location_point: locationPoint,
          images_urls: imageUrls,
          is_published: true,
          phone: phone.trim() || null,
          website: website.trim() || null,
          instagram: instagram.trim() || null,
          facebook: facebook.trim() || null,
        })

      if (insertError) {
        setError('A apărut o eroare la salvarea locației.')
        console.error(insertError)
        setLoading(false)
        return
      }

      onCreated()
    } catch (err) {
      console.error(err)
      setError('Eroare neașteptată. Încearcă din nou.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Leaflet CSS */}
      <style>{`@import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');`}</style>

      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-y-auto"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
          style={{ background: 'rgba(15,20,40,0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-xl font-bold text-white">📍 Adaugă Locație Nouă</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl font-light leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error */}
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm text-red-300"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Titlu *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Cascada Bigăr"
              className="w-full rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Descriere</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O scurtă descriere a locației..."
              className="w-full rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Categorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} style={{ background: '#1a1a2e' }}>{c}</option>
              ))}
            </select>
          </div>

          {/* Cities */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Orașe asociate <span className="text-xs text-gray-500">(apasă Enter după fiecare)</span>
            </label>
            <div
              className="flex flex-wrap gap-2 min-h-[44px] rounded-lg px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {cities.map((city) => (
                <span
                  key={city}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-indigo-200"
                  style={{ background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.4)' }}
                >
                  {city}
                  <button type="button" onClick={() => removeCity(city)} className="text-indigo-400 hover:text-white">×</button>
                </span>
              ))}
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={handleCityKeyDown}
                placeholder={cities.length === 0 ? 'ex: cluj-napoca' : ''}
                className="flex-1 min-w-[120px] bg-transparent text-white placeholder-gray-500 text-sm outline-none"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Adresă (opțional)</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ex: Strada Sforii nr. 1, Brașov"
              className="w-full rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <p className="text-xs text-gray-500 mt-1">Dacă lași coordonatele goale, vom încerca să le deducem din adresă.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Telefon (opțional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ex: +40 712 345 678"
                className="w-full rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            
            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Website (opțional)</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="ex: https://locatie.ro"
                className="w-full rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Instagram (opțional)</label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="ex: @locatie_ig"
                className="w-full rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            {/* Facebook */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Facebook (opțional)</label>
              <input
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="ex: https://facebook.com/locatie"
                className="w-full rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>

          {/* Map Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Coordonate GPS
              {lat !== null && lng !== null && (
                <span className="ml-2 text-xs text-emerald-400">
                  ✓ {lat.toFixed(5)}, {lng.toFixed(5)}
                </span>
              )}
            </label>
            <MapPicker lat={lat} lng={lng} onPick={(la, lo) => { setLat(la); setLng(lo) }} />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Imagini</label>
            <div
              className="rounded-lg p-4 cursor-pointer text-center transition-colors hover:border-indigo-500"
              style={{ border: '2px dashed rgba(255,255,255,0.15)' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <p className="text-gray-400 text-sm">📸 Click pentru a adăuga imagini</p>
              <p className="text-gray-600 text-xs mt-1">PNG, JPG, WebP acceptate</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            {imagePreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden aspect-video">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 rounded-full w-6 h-6 text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(239,68,68,0.85)' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-300 transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{
                background: loading
                  ? 'rgba(99,102,241,0.5)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 4px 15px rgba(99,102,241,0.35)',
              }}
            >
              {loading ? '⏳ Se salvează...' : '✨ Salvează Locația'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
