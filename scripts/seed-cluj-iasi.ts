import pkg from '@next/env'
const { loadEnvConfig } = pkg
loadEnvConfig(process.cwd())

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

const newLocations = [
  {
    "title": "Biserica Sfântul Mihail",
    "description": "Situată în Piața Unirii, Biserica Sfântul Mihail este unul dintre cele mai impunătoare monumente gotice din România. Cu un turn de 80 de metri, este a doua cea mai înaltă biserică din țară. Interiorul adăpostește vitralii superbe și o orgă barocă impresionantă. Este punctul central al orașului Cluj, fiind înconjurată de statuia lui Matia Corvin și numeroase clădiri istorice. O vizită aici oferă o perspectivă profundă asupra istoriei medievale a Transilvaniei.",
    "address": "Piața Unirii, Cluj-Napoca",
    "cities": ["Cluj-Napoca", "Cluj"],
    "category": "Religios",
    "lat": 46.7705,
    "lng": 23.5897,
    "images_urls": [
      "https://images.unsplash.com/photo-1596450514735-37597f8e355c?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1616428453444-142c65089069?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1582239474751-6df7976936ee?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    "title": "Cetățuia (Dealul Cetății)",
    "description": "Cetățuia este locul preferat de localnici și turiști pentru cea mai frumoasă panoramă asupra Clujului. Construită inițial ca o fortificație de tip Vauban în secolul al XVIII-lea, zona a devenit astăzi un parc public ideal pentru plimbări la apus. Scările de piatră te conduc spre diverse puncte de belvedere de unde poți vedea râul Someș și întreg centrul istoric. Este destinația perfectă pentru fotografii spectaculoase și momente de relaxare deasupra orașului.",
    "address": "Strada Șerpuitoare, Cluj-Napoca",
    "cities": ["Cluj-Napoca", "Cluj"],
    "category": "Agrement",
    "lat": 46.7744,
    "lng": 23.5828,
    "images_urls": [
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1515863261169-222d0d380f33?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1598902108854-10e335adac99?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    "title": "Teatrul Național Lucian Blaga",
    "description": "Inaugurat în 1906, Teatrul Național din Cluj este o bijuterie arhitecturală baroc-rococo. Fațada sa elegantă și interiorul opulent, decorat cu foiță de aur și catifea roșie, oferă o experiență culturală de lux. Alături de Opera Națională Română, clădirea reprezintă un pilon al artei spectacolului în România. Este situată în Piața Ștefan cel Mare, fiind una dintre cele mai frumoase clădiri de acest tip din Europa, cu o acustică și o atmosferă nobile.",
    "address": "Piața Ștefan cel Mare 2-4, Cluj-Napoca",
    "cities": ["Cluj-Napoca", "Cluj"],
    "category": "Cultură",
    "lat": 46.7701,
    "lng": 23.5969,
    "images_urls": [
      "https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1588612143468-46603348600d?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1579455359740-420959093015?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    "title": "Parcul Central Simion Bărnuțiu",
    "description": "Cu o istorie de peste 180 de ani, acesta este principalul spațiu verde al Clujului. Parcul adăpostește vechiul Cazinou și un lac unde te poți plimba cu barca vara sau patina iarna. Aleile umbrite de arbori seculari sunt ideale pentru jogging sau lectură. Este inima activă a orașului, găzduind frecvent festivaluri de jazz și evenimente comunitare. Atmosfera sa boemă și liniștea oferită chiar lângă centrul agitat fac din acest parc un loc iubit de toate generațiile.",
    "address": "Strada George Coșbuc, Cluj-Napoca",
    "cities": ["Cluj-Napoca", "Cluj"],
    "category": "Natură",
    "lat": 46.7692,
    "lng": 23.5786,
    "images_urls": [
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1510797215324-95aa89f43c33?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    "title": "Muzeul de Artă (Palatul Bánffy)",
    "description": "Găzduit în cel mai important palat baroc din Cluj, Muzeul de Artă expune colecții valoroase de pictură, sculptură și arte decorative românești și universale. Clădirea în sine este o operă de artă, cu o curte interioară spectaculoasă și săli decorate cu detalii arhitecturale fine. Expozițiile temporare aduc frecvent artiști contemporani în dialog cu maeștrii clasici. Este un spațiu de rafinament și inspirație, oferind o incursiune fascinantă în evoluția estetică a spațiului transilvănean.",
    "address": "Piața Unirii 30, Cluj-Napoca",
    "cities": ["Cluj-Napoca", "Cluj"],
    "category": "Cultură",
    "lat": 46.7711,
    "lng": 23.5908,
    "images_urls": [
      "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1518998053574-53f0263487aa?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1565103437295-92762c5b736b?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    "title": "Piața Muzeului",
    "description": "Cea mai veche piață din Cluj-Napoca, Piața Muzeului este o zonă pietonală plină de farmec și istorie. Aici se află Biserica Franciscană și Obeliscul Karolina. Străzile înguste, pavate cu piatră cubică, sunt ticsite cu terase cochete și cafenele intime care prind viață în serile de vară. Este locul unde poți simți cel mai bine atmosfera de oraș european vechi, fiind un refugiu relaxat de la zgomotul arterelor principale. Un spațiu boem, perfect pentru a înțelege spiritul comunității clujene.",
    "address": "Piața Muzeului, Cluj-Napoca",
    "cities": ["Cluj-Napoca", "Cluj"],
    "category": "Agrement",
    "lat": 46.7725,
    "lng": 23.5872,
    "images_urls": [
      "https://images.unsplash.com/photo-1563812239121-6f0f5b991325?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1577732899490-8e10086c2975?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1561564739-5a7a18d99416?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    "title": "Grădina Botanică Anastasie Fătu",
    "description": "Cea mai veche grădină botanică din România, spațiul din Iași este o destinație de excepție pentru iubitorii de natură. Se întinde pe o suprafață vastă și găzduiește sere cu plante exotice, un rozariu spectaculos și colecții de plante medicinale. În lunile de toamnă, expoziția de crizanteme atrage mii de vizitatori. Este o instituție de cercetare și educație, dar și un loc de plimbare liniștită, unde diversitatea vegetală oferă un spectacol vizual continuu în orice anotimp al anului.",
    "address": "Strada Dumbrava Roșie 7, Iași",
    "cities": ["Iași", "Iași"],
    "category": "Natură",
    "lat": 47.1856,
    "lng": 27.5583,
    "images_urls": [
      "https://images.unsplash.com/photo-1598902108854-10e335adac99?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    "title": "Mitropolia Moldovei și Bucovinei",
    "description": "Catedrala Mitropolitană din Iași este cel mai important centru de pelerinaj ortodox din România. Monumentul grandios impresionează prin picturile lui Gheorghe Tattarescu și adăpostește moaștele Sfintei Parascheva. Arhitectura eclectică, cu turnuri masive și decorațiuni fine, domină centrul orașului. Este un loc de o încărcătură spirituală imensă, unde credința se întâlnește cu istoria. Curtea catedralei și interiorul său liniștit oferă vizitatorilor un moment de reculegere și admirație pentru arta sacră românească autentică.",
    "address": "Bulevardul Ștefan cel Mare și Sfânt 16, Iași",
    "cities": ["Iași", "Iași"],
    "category": "Religios",
    "lat": 47.1614,
    "lng": 27.5821,
    "images_urls": [
      "https://images.unsplash.com/photo-1594894348618-971c26f0ba89?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1627448842600-e79435b80424?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1616428453444-142c65089069?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    "title": "Teatrul Național Vasile Alecsandri",
    "description": "Considerat unul dintre cele mai frumoase teatre din lume, edificiul din Iași este o capodoperă neoclasică. Sala mare este iluminată de un candelabru spectaculos cu 141 de lămpi de cristal de Veneția. Cortina pictată și fresca tavanului completează decorul aristocratic. Este locul unde a fost fondat primul teatru național din România, păstrând o tradiție culturală bogată. Fiecare detaliu arhitectural emană o eleganță aparte, transportând spectatorii într-o epocă de glorie a artelor dramatice și muzicale europene.",
    "address": "Strada Primăriei 1, Iași",
    "cities": ["Iași", "Iași"],
    "category": "Cultură",
    "lat": 47.1625,
    "lng": 27.5856,
    "images_urls": [
      "https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1588612143468-46603348600d?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1590422941913-912544e99505?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    "title": "Mănăstirea Sfinții Trei Ierarhi",
    "description": "Renumită pentru decorațiunile sale exterioare sculptate în piatră cu o migală incredibilă, această mănăstire este o capodoperă a artei brâncovenești. Fiecare centimetru de zid este acoperit cu motive geometrice și vegetale de inspirație orientală și celtică, fiind cândva aurite complet. Aici au fost aduse inițial moaștele Sfintei Parascheva și tot aici se află mormântul lui Alexandru Ioan Cuza. Este un monument istoric de o valoare inestimabilă, simbolizând epoca de aur a culturii moldovenești medievale sub Vasile Lupu.",
    "address": "Bulevardul Ștefan cel Mare și Sfânt 28, Iași",
    "cities": ["Iași", "Iași"],
    "category": "Istoric",
    "lat": 47.1606,
    "lng": 27.5847,
    "images_urls": [
      "https://images.unsplash.com/photo-1549180030-48bf079fb38a?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1577732899490-8e10086c2975?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1632766346294-d9263a232230?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    "title": "Parcul Copou (Teiul lui Eminescu)",
    "description": "Cel mai romantic și vechi parc din Iași, Copoul este faimos pentru teiul multisecular sub care marele poet Mihai Eminescu își găsea inspirația. Grădina publică adăpostește și Monumentul Legilor (Obeliscul cu Lei), cea mai veche sculptură publică din țară. Aleile largi, înconjurate de statui ale scriitorilor români, oferă o atmosferă literară și liniștită. Este locul preferat de studenți și turiști pentru relaxare, fiind un simbol al eleganței intelectuale ieșene și o mărturie vie a istoriei culturale românești.",
    "address": "Bulevardul Carol I, Iași",
    "cities": ["Iași", "Iași"],
    "category": "Natură",
    "lat": 47.1789,
    "lng": 27.5664,
    "images_urls": [
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1510797215324-95aa89f43c33?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    "title": "Palatul Roznovanu (Primăria Iași)",
    "description": "Situat în inima orașului, Palatul Roznovanu este un edificiu neoclasic impresionant care a fost centrul vieții politice și sociale a Iașului timp de secole. Clădirea, care astăzi găzduiește Primăria, a fost reședința uneia dintre cele mai bogate familii nobiliare moldovenești. Interiorul păstrează saloane fastuoase decorate cu fresce și mobilier de epocă. Aici au avut loc întâlniri istorice care au marcat destinul României moderne. Este un monument de o eleganță sobră, situat strategic pe axa culturală a orașului.",
    "address": "Bulevardul Ștefan cel Mare și Sfânt 11, Iași",
    "cities": ["Iași", "Iași"],
    "category": "Istoric",
    "lat": 47.1622,
    "lng": 27.5833,
    "images_urls": [
      "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1563812239121-6f0f5b991325?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1621516086776-664421b79f65?auto=format&fit=crop&q=80&w=1200"
    ]
  }
];

async function run() {
  console.log('Seeding new locations...')
  for (const loc of newLocations) {
    const payload = {
      title: loc.title,
      description: loc.description,
      address: loc.address,
      cities: loc.cities,
      category: loc.category,
      images_urls: loc.images_urls,
      location_point: `POINT(${loc.lng} ${loc.lat})`,
      is_published: true
    }

    // Check if it exists
    const { data: existing } = await supabase.from('locations').select('id').eq('title', loc.title);
    
    if (existing && existing.length > 0) {
      console.log(`⚠️ Skipping ${loc.title}, already exists.`);
      continue;
    }

    const { error } = await supabase.from('locations').insert(payload)
    if (error) {
       console.error(`❌ Failed to insert ${loc.title}`, error)
    } else {
       console.log(`✅ Inserted ${loc.title}`)
    }
  }
  console.log('Done.')
}

run()
