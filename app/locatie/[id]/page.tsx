import { getLocationById, incrementLocationViews } from '@/lib/actions/locations'
import { extractCoordinates } from '@/lib/utils/distance'
import { notFound } from 'next/navigation'
import { MapPin, ArrowLeft, Image as ImageIcon, Phone, Globe, Instagram, Facebook } from 'lucide-react'
import Link from 'next/link'
import MapWrapper from '@/components/MapWrapper'

// Resolve a commons.wikimedia.org/wiki/Special:FilePath URL to a direct upload.wikimedia.org URL
async function resolveWikimediaUrl(url: string): Promise<string> {
  if (!url.includes('Special:FilePath') && !url.includes('commons.wikimedia.org/wiki/')) return url
  const parts = url.split('/')
  let filename = parts[parts.length - 1]
  try { filename = decodeURIComponent(filename) } catch {}
  try {
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json&origin=*`
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'DiscoverRoApp/1.0' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return url
    const data = await res.json()
    const pages = data.query?.pages as Record<string, { imageinfo?: { url: string }[] }>
    const page = Object.values(pages)[0]
    return page?.imageinfo?.[0]?.url ?? url
  } catch {
    return url
  }
}

// Fetch the best available image for an OSM location:
//  1. Use stored images_urls if not a generic placeholder
//  2. Try Wikimedia via the wikipedia OSM tag (handles "ro:PageName" format)
//  3. Fall back to a Wikipedia search using the location title
//  4. Fall back to generic landscape
async function resolveHeroImage(location: {
  images_urls: string[] | null
  title: string | null
  description: string | null
}): Promise<string> {
  const PLACEHOLDER = 'photo-1521336575822-6da63fb45455'
  const FALLBACK    = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1920&q=80'

  // 1. Use stored image if it's not our seeder placeholder
  const stored = location.images_urls?.[0]
  if (stored && !stored.includes(PLACEHOLDER)) {
    // Resolve Special:FilePath URLs to direct URLs
    return resolveWikimediaUrl(stored)
  }

  // Helper to fetch Wikipedia thumbnail via the action API
  async function wikiThumbnail(lang: string, title: string): Promise<string | null> {
    try {
      const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=800&format=json&origin=*`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'DiscoverRoApp/1.0' },
        next: { revalidate: 86400 },
      })
      if (!res.ok) return null
      const data = await res.json()
      const pages = data.query?.pages as Record<string, { thumbnail?: { source: string } }> | undefined
      if (!pages) return null
      const page = Object.values(pages)[0]
      return page?.thumbnail?.source ?? null
    } catch {
      return null
    }
  }

  // 2. Extract Wikipedia tag from description "Wikipedia: ro:PageName" or "Wikipedia: PageName"
  const wikiMatch = location.description?.match(/Wikipedia:\s*(?:([a-z]{2}):)?(.+)/)
  if (wikiMatch) {
    const lang  = wikiMatch[1] ?? 'en'
    const title = wikiMatch[2].trim()
    const img   = await wikiThumbnail(lang, title)
    if (img) return img
  }

  // 3. Fall back to title-based search on Romanian Wikipedia, then English
  if (location.title) {
    const roImg = await wikiThumbnail('ro', location.title)
    if (roImg) return roImg
    const enImg = await wikiThumbnail('en', location.title)
    if (enImg) return enImg
  }

  return FALLBACK
}

export default async function LocationDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = await params
  const location = await getLocationById(id)

  if (!location) {
    notFound()
  }

  // Increment views silently in the background (no await to avoid blocking render if RPC is slow)
  incrementLocationViews(id).catch(console.error)

  const coords   = extractCoordinates(location.location_point)
  const heroImage = await resolveHeroImage(location)

  // Resolve all gallery image URLs (Special:FilePath → direct upload URLs)
  const resolvedGalleryUrls = location.images_urls && location.images_urls.length > 1
    ? await Promise.all(location.images_urls.slice(1).map(resolveWikimediaUrl))
    : []

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[300px] w-full md:h-[50vh]">
        <img
          src={heroImage}
          alt={location.title || 'Location'}
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />
        
        <div className="absolute top-0 left-0 w-full p-4 md:p-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 w-full px-4 pb-8 md:px-8 md:pb-12 max-w-7xl mx-auto">
          <div className="mb-4 inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-sm font-semibold tracking-wide text-white shadow-sm">
            {location.category}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-md">
            {location.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-200 sm:text-base font-medium">
            <MapPin className="h-5 w-5 text-indigo-400 shrink-0" />
            <span>{location.address}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          
          {/* Left Column: Description & Gallery */}
          <div className="space-y-10 lg:col-span-2">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Despre acest loc</h2>
              <div className="prose prose-lg prose-indigo max-w-none text-gray-600 leading-relaxed">
                {location.description ? (
                  <p>{location.description}</p>
                ) : (
                  <p className="italic text-gray-400">Nicio descriere disponibilă.</p>
                )}
              </div>

              {/* Action Buttons Section */}
              {(location.phone || location.website || location.instagram || location.facebook) && (
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  {location.phone && (
                    <a 
                      href={`tel:${location.phone}`}
                      className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-5 py-2.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 ring-1 ring-inset ring-indigo-700/10"
                    >
                      <Phone className="h-4 w-4" />
                      Sună
                    </a>
                  )}
                  {location.website && (
                    <a 
                      href={location.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 ring-1 ring-inset ring-gray-300 shadow-sm"
                    >
                      <Globe className="h-4 w-4 text-gray-500" />
                      Website
                    </a>
                  )}
                  {location.instagram && (
                    <a 
                      href={location.instagram.startsWith('http') ? location.instagram : `https://instagram.com/${location.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-pink-50 text-pink-600 transition-colors hover:bg-pink-100 ring-1 ring-inset ring-pink-600/10"
                      title="Instagram"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {location.facebook && (
                    <a 
                      href={location.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 ring-1 ring-inset ring-blue-600/10"
                      title="Facebook"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                </div>
              )}
            </section>

            {resolvedGalleryUrls.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
                  <ImageIcon className="h-6 w-6 text-indigo-500" />
                  Galerie
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {resolvedGalleryUrls.map((imgUrl: string, idx: number) => (
                    <div key={idx} className="aspect-w-1 aspect-h-1 overflow-hidden rounded-xl bg-gray-100 shadow-sm">
                      <img src={imgUrl} alt="Gallery item" referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform hover:scale-105 duration-300" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Map */}
          <div className="space-y-8">
            <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-gray-900/5 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-indigo-600" />
                Locație
              </h2>
              
              <div className="mb-6 space-y-4">
                <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Adresă</h3>
                  <p className="mt-1 font-medium text-gray-900">{location.address || 'Adresă indisponibilă'}</p>
                </div>
                {coords && (
                  <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Coordonate</h3>
                    <p className="mt-1 font-mono text-sm text-gray-700">{coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}</p>
                  </div>
                )}
              </div>

              {coords ? (
                <div className="overflow-hidden rounded-2xl relative z-10">
                  <MapWrapper 
                    lat={coords.lat} 
                    lon={coords.lon} 
                    title={location.title || 'Location marker'} 
                  />
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center rounded-2xl bg-gray-100 border border-dashed border-gray-300">
                  <p className="text-sm font-medium text-gray-500">Coordonate indisponibile</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
