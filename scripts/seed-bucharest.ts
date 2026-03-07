import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function resolveWikiUrl(url: string): Promise<string> {
  if (!url.includes('Special:FilePath')) return url;
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'manual' });
    if (res.status === 301 || res.status === 302 || res.status === 303 || res.status === 307 || res.status === 308) {
      const location = res.headers.get('location');
      if (location) return location;
    }
  } catch (e) {
    console.error('Failed to resolve URL', url, e);
  }
  return url;
}

const locations = [
  {
    "title": "Palatul Parlamentului",
    "description": "Cunoscut și sub numele de Casa Poporului, acest edificiu grandios reprezintă a doua cea mai mare clădire administrativă din lume. Construit în perioada comunistă, palatul impresionează prin dimensiunile sale titanice și interiorul opulent, decorat cu tone de marmură, candelabre gigantice de cristal și covoare țesute manual. Vizitatorii pot explora sălile monumentale și pot admira o panoramă unică asupra orașului de la balconul prezidențial, înțelegând mai bine istoria recentă și ambițiile arhitecturale ale României.",
    "address": "Strada Izvor 2-4, București",
    "cities": ["București"],
    "category": "altul",
    "lat": 44.4275,
    "lng": 26.0872,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Palatul_Parlamentului_1.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Bucuresti_palatul_parlamentului_view.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Palatul_Parlamentului.JPG"
    ]
  },
  {
    "title": "Ateneul Român",
    "description": "Inima culturii muzicale bucureștene, Ateneul Român este o capodoperă neoclasică inaugurată în 1888. Clădirea este faimoasă nu doar pentru arhitectura sa deosebită, ci și pentru acustica excepțională a sălii de concerte. Marea frescă din interior, care înconjoară cupola, ilustrează 25 de episoade glorioase din istoria poporului român. Este sediul Filarmonicii George Enescu și locul unde au loc cele mai importante mevenimente de muzică clasică din țară, fiind un simbol al eleganței capitalei.",
    "address": "Strada Benjamin Franklin 1-3, București",
    "cities": ["București"],
    "category": "altul",
    "lat": 44.4412,
    "lng": 26.0973,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Ateneul_Roman.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/AteneulRoman.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Ateneul_Român_02.jpg"
    ]
  },
  {
    "title": "Muzeul Național al Satului 'Dimitrie Gusti'",
    "description": "Situat pe malul lacului Herăstrău, acest muzeu în aer liber oferă o călătorie fascinantă prin satele tradiționale românești. Cu peste 300 de monumente originale, inclusiv case din lemn, biserici vechi, mori de vânt și ateliere meșteșugărești, muzeul recreează atmosfera vieții rurale din diverse regiuni ale țării. Este locul perfect pentru o plimbare relaxantă, oferind ocazia de a admira arhitectura populară autentică și de a descoperi obiceiurile și tradițiile transmise din generație în generație.",
    "address": "Șoseaua Pavel D. Kiseleff 28-30, București",
    "cities": ["București"],
    "category": "muzeu",
    "lat": 44.4725,
    "lng": 26.0764,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Muzeul_Satului_din_Bucuresti.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Muzeul_Satului_Bucuresti.JPG",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Ansamblul_Muzeul_Național_al_Satului_„Dimitrie_Gusti”_(1).jpg"
    ]
  },
  {
    "title": "Centrul Vechi (Lipscani)",
    "description": "Centrul istoric al Bucureștiului este locul unde trecutul medieval se întâlnește cu energia urbană contemporană. Strada Lipscani și arterele adiacente sunt pline de clădiri restaurate, restaurante cochete, baruri vibrante și galerii de artă. Aici se află și Curtea Veche, fosta reședință a lui Vlad Țepeș. Atmosfera este întotdeauna animată, fiind destinația preferată atât pentru turiști, cât și pentru localnicii care caută distracție, istorie sau pur și simplu o cafea savurată pe o terasă istorică.",
    "address": "Strada Lipscani, București",
    "cities": ["București"],
    "category": "altul",
    "lat": 44.4312,
    "lng": 26.1028,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Lipscani_Street,_Bucharest.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Centrul_Vechi_Bucuresti.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Hanul_Lui_Manuc_-2.jpg"
    ]
  },
  {
    "title": "Cărturești Carusel",
    "description": "Deseori numită 'Librăria de poveste', Cărturești Carusel este situată într-o clădire monument istoric din secolul al XIX-lea, restaurată spectaculos. Cu un design interior minimalist, dominat de scări curbe și coloane albe, librăria se întinde pe șase niveluri care includ un bistro la ultimul etaj și un spațiu dedicat artei contemporane. Este unul dintre cele mai fotografiate locuri din București, oferind o experiență culturală modernă într-un decor arhitectural de excepție care îți taie respirația.",
    "address": "Strada Lipscani 55, București",
    "cities": ["București"],
    "category": "altul",
    "lat": 44.4326,
    "lng": 26.1039,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Libraria_Carturesti_Carusel_-_Interior_ziua.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Libraria_Cărturești_Carusel,_Bucharest_(46410496141).jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/2020_Casă_cu_prăvălie_Carturesti_Carusel_(2).jpg"
    ]
  },
  {
    "title": "Parcul Herăstrău (Regele Mihai I)",
    "description": "Cel mai mare și mai îndrăgit parc din București, situat în partea de nord a orașului, este o oază de verdeață întinsă în jurul lacului cu același nume. Parcul oferă numeroase activități, de la plimbări cu barca și vaporașul, la piste pentru biciclete și zone dedicate sportului. Vizitatorii se pot bucura de Grădina Japoneză, Insula Trandafirilor și de numeroasele terase și restaurante de pe malul apei. Este locul ideal pentru relaxare în familie sau pentru o seară activă în mijlocul naturii urbane.",
    "address": "Șoseaua Pavel D. Kiseleff, București",
    "cities": ["București"],
    "category": "natura",
    "lat": 44.4707,
    "lng": 26.0815,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Parcul_Herastrau.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Parcul_Herastrau_park_Bucharest_Bucuresti_Romania.JPG",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Herăstrău,_municipiul_București,_Parcul_Herăstrău_01.JPG"
    ]
  },
  {
    "title": "Arcul de Triumf",
    "description": "Inspirat de celebrul monument din Paris, Arcul de Triumf din București celebrează victoria României în Primul Război Mondial și Marea Unire. Cu o înălțime de 27 de metri, monumentul este decorat cu sculpturi realizate de artiști români de renume. În interiorul său există un mic muzeu, iar în timpul sărbătorilor naționale, vizitatorii pot urca pe terasa superioară pentru o panoramă superbă asupra Bulevardului Kiseleff și a întregului oraș. Este un reper istoric fundamental al 'Micului Paris'.",
    "address": "Piața Arcul de Triumf, București",
    "cities": ["București"],
    "category": "altul",
    "lat": 44.4672,
    "lng": 26.0783,
    "images_urls": [
      "https://images.unsplash.com/photo-1563812239121-6f0f5b991325?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1577732899490-8e10086c2975?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    "title": "Grădina Botanică 'Dimitrie Brândză'",
    "description": "Înființată în 1860, Grădina Botanică din București este un spațiu dedicat conservării biodiversității și relaxării. Aceasta adăpostește peste 10.000 de specii de plante din diverse climate ale lumii. Punctele de atracție includ Serele Vechi, construite după modelul celor din Liege, Grădina Italiană și Muzeul Botanic. Este un refugiu liniștit, plin de culoare în fiecare anotimp, ideal pentru studenții la biologie, pasionații de fotografie sau familiile care doresc o evadare din zgomotul metropolei.",
    "address": "Șoseaua Cotroceni 32, București",
    "cities": ["București"],
    "category": "natura",
    "lat": 44.4358,
    "lng": 26.0645,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Bucharest_-_Botanical_Garden.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Bucarest_Botanical_garden_01.JPG",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Gradina_botanica_din_Bucuresti-Sera_veche.jpg"
    ]
  }
]

async function run() {
  console.log('Seeding 8 locations into Supabase for Bucharest with resolved URLs...')
  let successCount = 0

  const { data: existing } = await supabase.from('locations').select('id, title').eq('cities', '{București}')
  if (existing && existing.length > 0) {
    for (const ex of existing) {
      await supabase.from('locations').delete().eq('id', ex.id)
    }
  }

  for (const loc of locations) {
    const resolvedUrls = []
    for (const url of loc.images_urls) {
      const realUrl = await resolveWikiUrl(url)
      resolvedUrls.push(realUrl)
    }

    const payload = {
      title: loc.title,
      description: loc.description,
      address: loc.address,
      cities: loc.cities,
      category: loc.category,
      images_urls: resolvedUrls,
      location_point: `POINT(${loc.lng} ${loc.lat})`,
      is_published: true
    }

    const { data, error } = await supabase.from('locations').insert(payload)

    if (error) {
      console.error(`Failed to insert "${loc.title}":`, error.message)
    } else {
      console.log(`✅ Inserted: ${loc.title}`)
      successCount++
    }
  }

  console.log(`Done! Inserted ${successCount} out of ${locations.length} locations.`)
}

run()
