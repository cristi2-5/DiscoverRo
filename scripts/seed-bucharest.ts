import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

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
      "https://images.unsplash.com/photo-1555990445-43093282f93d?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1590422941913-912544e99505?auto=format&fit=crop&q=80&w=1200",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Palatul_Parlamentului_Bucuresti.jpg/1280px-Palatul_Parlamentului_Bucuresti.jpg"
    ]
  },
  {
    "title": "Ateneul Român",
    "description": "Inima culturii muzicale bucureștene, Ateneul Român este o capodoperă neoclasică inaugurată în 1888. Clădirea este faimoasă nu doar pentru arhitectura sa deosebită, ci și pentru acustica excepțională a sălii de concerte. Marea frescă din interior, care înconjoară cupola, ilustrează 25 de episoade glorioase din istoria poporului român. Este sediul Filarmonicii George Enescu și locul unde au loc cele mai importante evenimente de muzică clasică din țară, fiind un simbol al eleganței capitalei.",
    "address": "Strada Benjamin Franklin 1-3, București",
    "cities": ["București"],
    "category": "altul",
    "lat": 44.4412,
    "lng": 26.0973,
    "images_urls": [
      "https://images.unsplash.com/photo-1588612143468-46603348600d?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1616428453444-142c65089069?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1627382215444-42b71940a44f?auto=format&fit=crop&q=80&w=1200"
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
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Muzeul_Satului_din_Bucuresti.jpg/1280px-Muzeul_Satului_din_Bucuresti.jpg",
      "https://images.unsplash.com/photo-1596450514735-37597f8e355c?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1605648916361-9bc12ad6a569?auto=format&fit=crop&q=80&w=1200"
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
      "https://images.unsplash.com/photo-1579455359740-420959093015?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1561564739-5a7a18d99416?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1597523277024-8b65675e3c8f?auto=format&fit=crop&q=80&w=1200"
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
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=1200"
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
      "https://images.unsplash.com/photo-1598902108854-10e335adac99?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=1200"
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
      "https://images.unsplash.com/photo-1577732899490-8e10086c2975?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1549180030-48bf079fb38a?auto=format&fit=crop&q=80&w=1200"
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
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1515863261169-222d0d380f33?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1200"
    ]
  }
]

async function run() {
  console.log('Seeding 8 locations into Supabase...')
  let successCount = 0

  for (const loc of locations) {
    const payload = {
      title: loc.title,
      description: loc.description,
      address: loc.address,
      cities: loc.cities,
      category: loc.category,
      images_urls: loc.images_urls,
      location_point: `POINT(${loc.lng} ${loc.lat})`,
      is_published: true // Auto publish these
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
