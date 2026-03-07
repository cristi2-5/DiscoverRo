import Navbar from '@/components/Navbar'
import { Map, Compass, Calendar, Heart, ShieldCheck, Zap } from 'lucide-react'
import Image from 'next/image'

export const metadata = {
  title: 'Despre Noi - Discover RO',
  description: 'Află mai multe despre misiunea portalului Discover RO și cum te poate ajuta să explorezi România.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 py-24 sm:py-32">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1596450514735-37597f8e355c?auto=format&fit=crop&q=80&w=2000"
            alt="Transylvania Landscape"
            fill
            className="object-cover opacity-30"
            priority
          />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl drop-shadow-md">
              Descoperă inima României.
            </h1>
            <p className="mt-6 text-lg leading-8 text-amber-100">
              Suntem ghidul tău inteligent de călătorie. Prin Discover RO punem cele mai spectaculoase muzee, 
              parcuri, biserici și atracții istorice sau montane din România chiar în palmă. Tot ce-ți 
              rămâne e să vizitezi!
            </p>
          </div>
        </div>
      </div>

      {/* Our Mission */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20 pb-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Rolul Aplicației</h2>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Aplicația **Discover RO** este construită special pentru turiștii români și străini care vor să aibă parte 
            de un instrument <strong className="text-amber-600">toate-în-unul</strong> pentru vacanțe, excursii și weekend getaway-uri. Nu mai naviga pe forumuri 
            învechite – ai cele mai actuale date geolocalizate într-o interfață curată și fluidă, bazată pe tehnologia 
            inteligibilă open-source.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-32">
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            
            {/* Feature 1 */}
            <div className="flex flex-col bg-white p-8 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-amber-100">
              <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-slate-900">
                <Compass className="h-6 w-6 flex-none text-amber-500" aria-hidden="true" />
                Sute de Obiective
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                <p className="flex-auto">
                  Portalul este agregat zilnic cu top locații. De la Castelul Peleș sau Centrul Vechi plin de viață al Craiovei și până la Turnul Sfatului din Sibiu sau liniștea Deltei. Ai categorii intuitive pentru religios, natură, istorie, muzeu etc.
                </p>
              </dd>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col bg-white p-8 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-amber-100">
              <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-slate-900">
                <Map className="h-6 w-6 flex-none text-amber-500" aria-hidden="true" />
                Hartă Inteligentă
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                <p className="flex-auto">
                  Vezi imediat tot ce poți vizita în preajma ta! Folosim OpenStreetMap și servicii geospațiale Supabase de ultimă generație pentru a-ți sorta rezultatele prin coordonate vizuale, astfel încât obiectivele din orașul tău vor fi întotdeauna primele.
                </p>
              </dd>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col bg-white p-8 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-amber-100">
              <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-slate-900">
                <Calendar className="h-6 w-6 flex-none text-amber-500" aria-hidden="true" />
                Planificator Vacanțe
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                <p className="flex-auto">
                  Adaugă locații preferate apărând butonul "inimă" <Heart className="h-4 w-4 inline text-rose-500" />. Acestea ajung direct în agenda ta rutieră unde le poți asigna zilei adecvate (Da, Plannerul pe 10 zile cu drag&drop). Cele mai apreciate obiective din platformă ajung la top popularitate.
                </p>
              </dd>
            </div>

          </dl>
        </div>
      </div>
      
      {/* Mini Footer Teaser */}
      <div className="bg-amber-50 py-16">
         <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col items-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 text-center">Gata de o vacanță națională spectaculoasă?</h2>
            <div className="mt-8 flex items-center justify-center gap-x-6">
              <a href="/" className="rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 transition-colors">
                Începe explorarea
              </a>
            </div>
         </div>
      </div>
    </div>
  )
}
