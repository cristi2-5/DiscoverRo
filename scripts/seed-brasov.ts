import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Resolves a Wikipedia Special:FilePath to the true upload.wikimedia.org direct image URL
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
    "title": "Biserica Neagră",
    "description": "Biserica Neagră este cel mai mare edificiu religios în stil gotic din sud-estul Europei și simbolul incontestabil al Brașovului. Construită în secolele XIV-XV, a primit numele actual după marele incendiu din 1689 care i-a înnegrit zidurile. În interior, vizitatorii pot admira o colecție unică de covoare orientale, o orgă mecanică Buchholz faimoasă pentru sunetul său și o cristelniță din bronz de la 1472. Este un monument impunător care domină centrul vechi, oferind o experiență spirituală și istorică de neegalat.",
    "address": "Curtea Johannes Honterus 2, Brașov",
    "cities": ["Brașov"],
    "category": "altul",
    "lat": 45.6410,
    "lng": 25.5878,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Black_Church_Brasov_2017.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Biserica_Neagră_din_Brașov_-_văzută_din_Turnul_Alb.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Brasov_Biserica_Neagra_interior_02.jpg"
    ]
  },
  {
    "title": "Piața Sfatului",
    "description": "Piața Sfatului reprezintă inima vibrantă a Brașovului medieval, fiind locul unde pe timpuri se organizau târguri anuale vizitate de negustori din toate țările românești. În centrul pieței se află Casa Sfatului, vechea primărie a orașului, care astăzi găzduiește Muzeul Județean de Istorie. Înconjurată de clădiri colorate cu arhitectură barocă și numeroase terase primitoare, piața este locul ideal pentru a simți pulsul orașului, fiind poarta de intrare către majoritatea obiectivelor turistice importante din centrul istoric.",
    "address": "Piața Sfatului, Brașov",
    "cities": ["Brașov"],
    "category": "altul",
    "lat": 45.6425,
    "lng": 25.5889,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Piata_Sfatului_Brasov_2018.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Casa_Sfatului_din_Brașov.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Council_Square_Brasov_Panoramic.jpg"
    ]
  },
  {
    "title": "Muntele Tâmpa",
    "description": "Muntele Tâmpa este rezervația naturală care străjuiește Brașovul, oferind cele mai spectaculoase puncte de belvedere asupra orașului. Vizitatorii pot urca pe culme fie pe trasee marcate prin pădure, fie folosind telecabina care ajunge aproape de faimoasele litere 'BRASOV'. De sus, panorama asupra centrului istoric și a Bisericii Negre este uluitoare. Este locul preferat al amatorilor de drumeții și fotografie, oferind un refugiu de liniște și aer curat la doar câteva minute distanță de agitația urbană.",
    "address": "Aleea Tiberiu Brediceanu, Brașov",
    "cities": ["Brașov"],
    "category": "natura",
    "lat": 45.6375,
    "lng": 25.5933,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Tampa_mountain_seen_from_Brasov.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Brasov_from_Tampa.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/The_Hollywood_sign_of_Brașov_on_Tâmpa_mountain.jpg"
    ]
  },
  {
    "title": "Strada Sforii",
    "description": "Strada Sforii este una dintre cele mai înguste străzi din Europa, având o lățime ce variază între 1,11 și 1,35 metri. Construită inițial ca un coridor de acces pentru pompieri în secolul al XVII-lea, strada a devenit astăzi o atracție turistică de top datorită farmecului său aparte. Plimbarea prin acest pasaj îngust, flancat de ziduri vechi ce par să se apropie, oferă o perspectivă inedită asupra planificării urbane medievale. Este un loc plin de legende și un punct obligatoriu pentru fotografii memorabile.",
    "address": "Strada Sforii, Brașov",
    "cities": ["Brașov"],
    "category": "altul",
    "lat": 45.6394,
    "lng": 25.5891,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Strada_Sforii_Brașov_2014.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Rope_Street_Brasov_Entrance.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Strada_Sforii_view.jpg"
    ]
  },
  {
    "title": "Turnul Alb",
    "description": "Turnul Alb este un punct fortificat semicircular, construit la sfârșitul secolului al XV-lea pentru a proteja orașul de atacuri. Situat pe un promontoriu stâncos deasupra Bastionului Graft, turnul oferă o vedere panoramică spectaculoasă asupra întregii cetăți a Brașovului. Interiorul său găzduiește ocazional expoziții de istorie. Accesul se face pe scări abrupte, dar efortul este răsplătit din plin de una dintre cele mai frumoase imagini ale Bisericii Negre încadrată de acoperișurile roșii ale centrului vechi.",
    "address": "Calea Poienii, Brașov",
    "cities": ["Brașov"],
    "category": "altul",
    "lat": 45.6441,
    "lng": 25.5872,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Turnul_Alb_Brasov_2012.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/White_Tower_Brasov_Aerial.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/View_from_the_White_Tower_Brasov.jpg"
    ]
  },
  {
    "title": "Bastionul Țesătorilor",
    "description": "Situat în colțul de sud-vest al cetății, Bastionul Țesătorilor este cel mai bine conservat monument de acest tip din Brașov. Cu o arhitectură unică și ziduri groase de peste 4 metri, bastionul a fost apărat și întreținut de breasla țesătorilor de in. În prezent, găzduiește o secție a Muzeului Județean de Istorie, unde piesa de rezistență este macheta vechii cetăți a Brașovului de la 1896. Curtea sa interioară, cu galerii de lemn pe trei niveluri, oferă o atmosferă medievală autentică și o acustică deosebită.",
    "address": "Strada George Coșbuc 9, Brașov",
    "cities": ["Brașov"],
    "category": "muzeu",
    "lat": 45.6385,
    "lng": 25.5905,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Bastionul_Tesatorilor_Brasov_2014.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Weavers_Bastion_Interior_Courtyard.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Bastionul_Tesatorilor_View.jpg"
    ]
  },
  {
    "title": "Poarta Șchei",
    "description": "Construită în stil neoclasic la începutul secolului al XIX-lea, Poarta Șchei marca intrarea principală dinspre cartierul românesc Șchei spre cetatea fortificată a sașilor. Cu o arhitectură ce amintește de un arc de triumf, poarta are trei intrări: una centrală, mare, pentru vehicule și două laterale, mai mici, pentru pietoni. Este un monument elegant care separă istoric cele două lumi ale orașului vechi, fiind poarta de acces către biserici vechi românești și către atmosfera pitorească a străzilor în pantă din Șcheii Brașovului.",
    "address": "Strada Poarta Șchei, Brașov",
    "cities": ["Brașov"],
    "category": "altul",
    "lat": 45.6397,
    "lng": 25.5864,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Poarta_Schei_Brasov.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Schei_Gate_Brasov_Exterior.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Brasov_Poarta_Schei_detail.jpg"
    ]
  },
  {
    "title": "Prima Școală Românească",
    "description": "Situată în curtea Bisericii Sfântul Nicolae din Șchei, Prima Școală Românească este un tezaur al culturii naționale. Aici s-au tipărit primele cărți în limba română de către Diaconul Coresi și s-au pus bazele învățământului românesc. Muzeul adăpostește peste 4.000 de cărți rare și numeroase documente vechi, fiind un loc de pelerinaj cultural. Vizitatorii pot intra în vechea sală de clasă și pot vedea tiparnița originală, înțelegând eforturile uriașe depuse pentru păstrarea limbii și identității românești în perioada medievală.",
    "address": "Piața Unirii 2-3, Brașov",
    "cities": ["Brașov"],
    "category": "muzeu",
    "lat": 45.6358,
    "lng": 25.5815,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Prima_Scoala_Romaneasca_Brasov.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Interior_Prima_Scoala_Romaneasca.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/First_Romanian_School_Museum.jpg"
    ]
  }
]

async function run() {
  console.log('Seeding Brasov locations with resolved Wikimedia URLs...')
  let successCount = 0

  for (const loc of locations) {
    // 1. Resolve URLs
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

    const { error } = await supabase.from('locations').insert(payload)

    if (error) {
      console.error(`Failed to insert "${loc.title}":`, error.message)
    } else {
      console.log(`✅ Inserted: ${loc.title}`)
      successCount++
    }
  }

  console.log(`Done! Inserted ${successCount} out of ${locations.length} locations in Brașov.`)
}

run()
