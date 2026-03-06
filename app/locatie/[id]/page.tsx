import { getLocationById } from '@/lib/actions/locations'
import { extractCoordinates } from '@/lib/utils/distance'
import { notFound } from 'next/navigation'
import { MapPin, ArrowLeft, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import MapWrapper from '@/components/MapWrapper'

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

  const coords = extractCoordinates(location.location_point)
  
  // Decide hero image
  const heroImage = location.images_urls && location.images_urls.length > 0
    ? location.images_urls[0]
    : 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1920&q=80'

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[300px] w-full md:h-[50vh]">
        <img
          src={heroImage}
          alt={location.title || 'Location'}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />
        
        {/* Top bar over hero */}
        <div className="absolute top-0 left-0 w-full p-4 md:p-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Hero Content */}
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

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          
          {/* Left Column: Description & Gallery */}
          <div className="space-y-10 lg:col-span-2">
            
            {/* Description */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">About this place</h2>
              <div className="prose prose-lg prose-indigo max-w-none text-gray-600 leading-relaxed">
                {location.description ? (
                  <p>{location.description}</p>
                ) : (
                  <p className="italic text-gray-400">No description available for this location.</p>
                )}
              </div>
            </section>

            {/* Gallery (If more than 1 image) */}
            {location.images_urls && location.images_urls.length > 1 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight flex items-center gap-2">
                  <ImageIcon className="h-6 w-6 text-indigo-500" />
                  Gallery
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {location.images_urls.slice(1).map((imgUrl: string, idx: number) => (
                    <div key={idx} className="aspect-w-1 aspect-h-1 overflow-hidden rounded-xl bg-gray-100 shadow-sm">
                      <img src={imgUrl} alt="Gallery item" className="h-full w-full object-cover transition-transform hover:scale-105 duration-300" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Location Map */}
          <div className="space-y-8">
            <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-gray-900/5 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-indigo-600" />
                Location
              </h2>
              
              <div className="mb-6 space-y-4">
                 <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Address</h3>
                    <p className="mt-1 font-medium text-gray-900">{location.address}</p>
                 </div>
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
                  <p className="text-sm font-medium text-gray-500">Map coordinates missing</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
