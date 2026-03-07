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
    "title": "Piața Mare din Sibiu",
    "description": "Piața Mare este centrul istoric și social al Sibiului încă din secolul al XIV-lea, fiind una dintre cele mai mari piețe din Transilvania. Este celebră pentru 'ochii Sibiului' – ferestrele acoperișurilor care par să urmărească trecătorii. Înconjurată de monumente de prestigiu precum Palatul Brukenthal și Biserica Romano-Catolică, piața găzduiește cele mai importante evenimente culturale, inclusiv faimosul Târg de Crăciun. Atmosfera medievală bine conservată și spațiul generos fac din acest loc punctul zero al oricărei vizite în oraș.",
    "address": "Piața Mare, Sibiu",
    "cities": ["Sibiu"],
    "category": "altul",
    "lat": 45.7967,
    "lng": 24.1511,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Sibiu_Piata_Mare_1.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Sibiu_Grand_Square_View.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Eyes_of_Sibiu_Roofs.jpg"
    ]
  },
  {
    "title": "Podul Minciunilor",
    "description": "Podul Minciunilor este primul pod de fontă din România și un simbol romantic al Sibiului. Situat în Piața Mică, acesta face legătura între Orașul de Sus și Orașul de Jos. Legenda spune că podul are urechi și puteri magice, începând să scârțâie sau chiar să se prăbușească dacă cineva rostește o minciună în timp ce îl traversează. Arhitectura sa elegantă, cu decorațiuni din fier forjat, îl transformă în cel mai fotografiat loc din Sibiu, fiind o oprire obligatorie pentru orice turist.",
    "address": "Piața Mică, Sibiu",
    "cities": ["Sibiu"],
    "category": "altul",
    "lat": 45.7983,
    "lng": 24.1503,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Bridge_of_Lies_Sibiu_2018.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Podul_Minciunilor_Sibiu_view.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Lies_Bridge_Fier_Forjat.jpg"
    ]
  },
  {
    "title": "Muzeul Național Brukenthal",
    "description": "Inaugurat în 1817 în palatul baronului Samuel von Brukenthal, acesta este cel mai vechi muzeu din România și unul dintre primele din Europa. Găzduiește o colecție impresionantă de artă europeană, inclusiv lucrări de Jan van Eyck, Titian și Bruegel. Palatul în sine este o bijuterie a barocului transilvănean, păstrând decorul original în multe dintre sălile sale. Vizitatorii pot explora galerii de artă plastică, biblioteci vechi și colecții de istorie, fiind un punct de referință absolut pentru iubitorii de cultură și rafinament.",
    "address": "Piața Mare 4-5, Sibiu",
    "cities": ["Sibiu"],
    "category": "muzeu",
    "lat": 45.7964,
    "lng": 24.1501,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Brukenthal_Palace_Sibiu.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Brukenthal_Museum_Interior.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Samuel_von_Brukenthal_Palace_Facade.jpg"
    ]
  },
  {
    "title": "Muzeul ASTRA (Dumbrava Sibiului)",
    "description": "Situat în parcul natural Dumbrava Sibiului, acesta este cel mai mare muzeu în aer liber din Europa dedicat civilizației populare tradiționale. Pe o suprafață de 96 de hectare, muzeul expune peste 300 de monumente originale: case țărănești, mori de vânt și de apă, biserici de lemn și ateliere meșteșugărești. Plimbarea prin muzeu oferă o imagine fidelă a vieții rurale românești de odinioară. Este un loc ideal pentru familii, oferind plimbări cu trăsura, barca pe lac și numeroase ateliere interactive care păstrează vii tradițiile populare.",
    "address": "Strada Pădurea Dumbrava 14, Sibiu",
    "cities": ["Sibiu"],
    "category": "muzeu",
    "lat": 45.7533,
    "lng": 24.1205,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Muzeul_Astra_Sibiu_-_Moara_de_vant.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Astra_Museum_Lake_View.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Traditional_House_Astra_Museum.jpg"
    ]
  },
  {
    "title": "Catedrala Evanghelică Sf. Maria",
    "description": "Catedrala Evanghelică domină Piața Huet cu turnul său impunător de 73 de metri, cel mai înalt din Transilvania. Construită în secolul al XIV-lea pe locul unei vechi bazilici, biserica este un monument gotic spectaculos. Interiorul adăpostește o orgă gigantică, o cristelniță de bronz celebră și numeroase pietre funerare ale personalităților sibiene, inclusiv a lui Mihnea cel Rău, fiul lui Vlad Țepeș. Turnul oferă o panoramă uluitoare de 360 de grade asupra orașului vechi, fiind punctul ideal pentru a înțelege structura medievală a cetății.",
    "address": "Piața Huet, Sibiu",
    "cities": ["Sibiu"],
    "category": "altul",
    "lat": 45.7977,
    "lng": 24.1495,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Evangelical_Cathedral_Sibiu_2017.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Interior_of_the_Lutheran_Cathedral_of_Saint_Mary.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Sibiu_Huet_Square_Cathedral.jpg"
    ]
  },
  {
    "title": "Turnul Sfatului",
    "description": "Turnul Sfatului este unul dintre cele mai vechi și emblematice monumente ale Sibiului, făcând legătura între Piața Mare și Piața Mică. De-a lungul secolelor, a servit drept turn de poartă, depozit de grâne, foișor de foc și chiar închisoare. Vizitatorii pot urca cele 141 de trepte pentru a vedea mecanismul ceasului și pentru a admira panorama centrului istoric. Este simbolul continuității orașului, oferind o perspectivă unică asupra acoperișurilor medievale și a Munților Făgăraș care se zăresc în depărtare în zilele senine.",
    "address": "Piața Mică 1, Sibiu",
    "cities": ["Sibiu"],
    "category": "altul",
    "lat": 45.7974,
    "lng": 24.1508,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Turnul_Sfatului_Sibiu_2015.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Council_Tower_Sibiu_Interior.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/View_from_Council_Tower_Sibiu.jpg"
    ]
  },
  {
    "title": "Pasajul Scărilor",
    "description": "Pasajul Scărilor, cunoscut și sub numele de 'Zidul cu Ace', este cel mai pitoresc loc de legătură între Orașul de Sus și Orașul de Jos din Sibiu. Construit din piatră și cărămidă în secolul al XIV-lea, pasajul păstrează intactă atmosfera medievală prin arcadele sale masive și zidurile fortificate. O plimbare pe aici oferă o experiență boemă, trecând pe lângă restaurante vechi și clădiri istorice cu detalii arhitecturale unice. Este locul unde istoria pare să fi stat în loc, fiind extrem de popular printre artiști și pasionații de fotografie urbană.",
    "address": "Piața Huet / Pasajul Scărilor, Sibiu",
    "cities": ["Sibiu"],
    "category": "altul",
    "lat": 45.7971,
    "lng": 24.1488,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Pasajul_Scarilor_Sibiu_2017.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Stairs_Passage_Sibiu_Ancient_Wall.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Sibiu_medieval_stairs.jpg"
    ]
  },
  {
    "title": "Catedrala Mitropolitană Sfânta Treime",
    "description": "Catedrala Mitropolitană din Sibiu este sediul Mitropoliei Ardealului și o capodoperă a stilului bizantin, inspirată de Sfânta Sofia din Constantinopol. Exteriorul este decorat cu benzi de cărămidă galbenă și roșie, iar cele două turnuri masive încadrează o intrare monumentală. Interiorul este de o frumusețe copleșitoare, fiind complet pictat în stil neobizantin și luminat de un candelabru aurit impresionant. Catedrala reprezintă un simbol al spiritualității ortodoxe românești într-un oraș cu o puternică moștenire multiconfesională, fiind un loc de reculegere de o rară splendoare.",
    "address": "Strada Mitropoliei 33-35, Sibiu",
    "cities": ["Sibiu"],
    "category": "altul",
    "lat": 45.7937,
    "lng": 24.1469,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Sibiu_Orthodox_Cathedral_Cathedrala_Mitropolitana.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Interior_Sibiu_Orthodox_Cathedral.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Orthodox_Cathedral_Sibiu_Exterior_Detail.jpg"
    ]
  },
  {
    "title": "Castelul Peleș",
    "description": "Castelul Peleș, fosta reședință de vară a familiei regale, este considerat unul dintre cele mai frumoase castele din Europa. Construit în stil neo-renascentist german la sfârșitul secolului al XIX-lea, castelul uimește prin detaliile sale exterioare din lemn și piatră. Interiorul celor 160 de camere este de o opulență incredibilă, cu decorațiuni din lemn de nuc, vitralii germane, covoare de lână de la Smirna și colecții de arme ce însumează peste 4000 de piese. Amplasarea sa în inima munților Sinaia îi oferă un aer de poveste regală autentică, fiind cel mai vizitat muzeu din țară.",
    "address": "Aleea Peleșului 2, Sinaia",
    "cities": ["Sinaia"],
    "category": "muzeu",
    "lat": 45.3599,
    "lng": 25.5426,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Castelul_Peles_Sinaia_2017.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Peles_Castle_Grand_Hall.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Castelul_Peles_Interior_Detail.jpg"
    ]
  },
  {
    "title": "Castelul Pelișor",
    "description": "Situat la doar câteva sute de metri de Peleș, Pelișorul a fost construit pentru Regele Ferdinand și Regina Maria. Spre deosebire de grandoarea Peleșului, Pelișorul este mai intim și reflectă gusturile artistice ale Reginei Maria, fiind decorat în stil Art Nouveau. Piesa de rezistență este 'Camera de Aur', proiectată chiar de regină, cu pereți placați cu frunze de aur și decorațiuni celtice. Castelul păstrează o atmosferă personală, oferind o incursiune în universul privat al monarhilor României, fiind un loc de o eleganță discretă și plină de simbolism.",
    "address": "Aleea Peleșului 2, Sinaia",
    "cities": ["Sinaia"],
    "category": "muzeu",
    "lat": 45.3606,
    "lng": 25.5398,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Castelul_Pelisor.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Pelisor_Castle_Golden_Room.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Sinaia_Pelisor_Castle_Exterior.jpg"
    ]
  },
  {
    "title": "Mănăstirea Sinaia",
    "description": "Supranumită 'Catedrala Carpaților', Mănăstirea Sinaia este locul de unde orașul și-a luat numele, inspirat de muntele Sinai din Egipt. Fondată în secolul al XVII-lea, mănăstirea cuprinde două biserici: Biserica Veche, mică și pitorească, și Biserica Mare, construită mai târziu în stil brâncovenesc. Aici se află primul muzeu de artă religioasă din România, care adăpostește prima Biblie tradusă în limba română la București. Curtea mănăstirii este de o liniște profundă, oferind vizitatorilor o oază de pace spirituală și un exemplu remarcabil de arhitectură sacră românească.",
    "address": "Strada Mănăstirii 2, Sinaia",
    "cities": ["Sinaia"],
    "category": "altul",
    "lat": 45.3551,
    "lng": 25.5492,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Manastirea_Sinaia_Biserica_Mare.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Sinaia_Monastery_Old_Church.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Interior_Manastirea_Sinaia.jpg"
    ]
  },
  {
    "title": "Cazinoul Sinaia",
    "description": "Cazinoul Sinaia este un monument istoric impunător situat în parcul 'Dimitrie Ghica', construit la inițiativa regelui Carol I în 1912. Proiectat de arhitectul Petre Antonescu, cazinoul a fost un centru al luxului și eleganței europene în perioada interbelică. Astăzi, clădirea servește drept Centru Internațional de Conferințe, dar sălile sale fastuoase, precum Sala Oglinzilor sau Sala Baccara, pot fi vizitate în cadrul unor tururi ghidate. Cu o arhitectură eclectică și interioare ce păstrează strălucirea epocii de aur, cazinoul rămâne un reper cultural major al orașului montan.",
    "address": "Bulevardul Carol I nr. 2, Sinaia",
    "cities": ["Sinaia"],
    "category": "altul",
    "lat": 45.3558,
    "lng": 25.5528,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Casino_Sinaia_-_panoramio.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Casino_Sinaia_Main_Hall.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Sinaia_Casino_Park_View.jpg"
    ]
  },
  {
    "title": "Gara Regală Sinaia",
    "description": "Gara din Sinaia nu este doar un punct de transport, ci un monument istoric de o importanță deosebită, fiind formată din două clădiri regale. Prima gară a fost construită în 1913, exclusiv pentru trenurile regale și pentru oaspeții de rang înalt ai monarhiei. Aici a fost gara de unde pleca celebrul Orient Express în drumul său spre Constantinopol. Gara păstrează un salon regal impresionant și o placă memorială în onoarea lui I.G. Duca. Este o destinație fascinantă pentru iubitorii de istorie feroviară, oferind o perspectivă asupra epocii de glorie a călătoriilor cu trenul.",
    "address": "Piața Gării, Sinaia",
    "cities": ["Sinaia"],
    "category": "altul",
    "lat": 45.3542,
    "lng": 25.5556,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Gara_Sinaia_2017.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Sinaia_Royal_Train_Station.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Train_Station_Sinaia_View.jpg"
    ]
  },
  {
    "title": "Parcul Dimitrie Ghica",
    "description": "Parcul Dimitrie Ghica este inima verde a stațiunii Sinaia, fiind un loc ideal pentru plimbări relaxante și recreere. Înființat în 1881, parcul găzduiește arbori seculari, busturile unor personalități care au iubit Sinaia (precum Mihai Eminescu sau Ion Creangă) și faimosul Cazinou. Iarna, parcul devine un loc magic cu un patinoar modern, iar vara este centrul festivalurilor locale. Este punctul de întâlnire principal al turiștilor, oferind spații de joacă pentru copii și fântâni arteziene care completează atmosfera liniștită a 'Perlei Carpaților'.",
    "address": "Bulevardul Carol I, Sinaia",
    "cities": ["Sinaia"],
    "category": "natura",
    "lat": 45.3555,
    "lng": 25.5515,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Parcul_Dimitrie_Ghica_Sinaia.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Sinaia_Park_View_with_Flowers.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Autumn_in_Sinaia_Park.jpg"
    ]
  },
  {
    "title": "Cota 1400 / Munții Bucegi",
    "description": "Cota 1400 reprezintă poarta de intrare către universul alpin al Munților Bucegi, fiind accesibilă din Sinaia prin telecabină sau pe un drum auto spectaculos. De aici, vizitatorii au parte de o panoramă uluitoare asupra Văii Prahovei și a stațiunii. Este un punct de plecare popular pentru numeroase trasee montane către Cota 2000, Vârful Omu sau Sfinxul și Babele. Fie că ești pasionat de schi iarna sau de drumeții vara, Cota 1400 oferă aer curat, peisaje montane de neuitat și posibilitatea de a simți măreția naturii la înălțime.",
    "address": "Drumul Cotelor, Sinaia",
    "cities": ["Sinaia"],
    "category": "natura",
    "lat": 45.3415,
    "lng": 25.5185,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Sinaia_Cota_1400_View.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Bucegi_Mountains_from_Sinaia.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Cota_1400_Winter_Panorama.jpg"
    ]
  },
  {
    "title": "Vila Luminiș (Casa George Enescu)",
    "description": "Vila Luminiș a fost reședința de vară și locul de creație preferat al marelui compozitor George Enescu în Sinaia. Construită în stil românesc autentic, vila este situată în cartierul Cumpătu și oferă o vedere superbă spre masivul Bucegi. Astăzi este muzeu memorial, păstrând obiecte personale, mobilier original și pianul compozitorului. Atmosfera casei respiră cultură și modestie, oferind o perspectivă intimă asupra vieții artistului care a transformat folclorul românesc în muzică universală. Este o destinație esențială pentru iubitorii de muzică clasică și artă.",
    "address": "Strada Yehudi Menuhin 2, Sinaia",
    "cities": ["Sinaia"],
    "category": "muzeu",
    "lat": 45.3615,
    "lng": 25.5612,
    "images_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Casa_George_Enescu_Sinaia_Vila_Luminis.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/George_Enescu_Memorial_House_Interior.jpg",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Vila_Luminis_Sinaia_Garden.jpg"
    ]
  }
]

async function run() {
  console.log('Seeding locations for Sibiu and Sinaia with resolved URLs...')
  let successCount = 0

  // Optional: clear existing ones for Sibiu and Sinaia to avoid duplicates during testing
  const { data: existingSibiu } = await supabase.from('locations').select('id, title').eq('cities', '{Sibiu}')
  if (existingSibiu && existingSibiu.length > 0) {
    for (const ex of existingSibiu) await supabase.from('locations').delete().eq('id', ex.id)
  }
  const { data: existingSinaia } = await supabase.from('locations').select('id, title').eq('cities', '{Sinaia}')
  if (existingSinaia && existingSinaia.length > 0) {
    for (const ex of existingSinaia) await supabase.from('locations').delete().eq('id', ex.id)
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
