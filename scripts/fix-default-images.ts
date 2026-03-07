import pkg from '@next/env'
const { loadEnvConfig } = pkg
loadEnvConfig(process.cwd())

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

const DEFAULT_IMAGE_URL = 'https://images.unsplash.com/photo-1521336575822-6da63fb45455?auto=format&fit=crop&w=800&q=80';

// A simple utility to wait
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function findWikiImage(title: string, cityList: string[] | null) {
  try {
    let searchTerm = title;
    if (cityList && cityList.length > 0) {
      // Append the first city for better context, except for known big titles
      const city = cityList[0];
      const normalizedTitle = title.toLowerCase();
      if (!normalizedTitle.includes(city.toLowerCase())) {
         searchTerm = `${title} ${city}`;
      }
    }
    
    // 1. Search for closest image on Wikimedia Commons
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=${encodeURIComponent(searchTerm)}&utf8=&format=json`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    // If no results with city context, try just the title
    let results = searchData.query?.search;
    if ((!results || results.length === 0) && searchTerm !== title) {
        const fallbackSearchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=${encodeURIComponent(title)}&utf8=&format=json`;
        const fallbackRes = await fetch(fallbackSearchUrl);
        const fallbackData = await fallbackRes.json();
        results = fallbackData.query?.search;
    }

    if (!results || results.length === 0) return null;
    
    // Filter to finding a JPG or PNG file
    const fileNode = results.find((r: any) => r.title.toLowerCase().endsWith('.jpg') || r.title.toLowerCase().endsWith('.jpeg') || r.title.toLowerCase().endsWith('.png'));
    if (!fileNode) return null;
    
    const fileTitle = fileNode.title;
    
    // 2. Get the actual image URL for that file
    const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    
    if (pageId === '-1' || !pages[pageId].imageinfo || pages[pageId].imageinfo.length === 0) return null;
    return pages[pageId].imageinfo[0].url;
  } catch (e) {
    return null;
  }
}

async function run() {
  console.log('Finding locations with Unsplash fallback images...')
  const { data: locations, error } = await supabase.from('locations').select('id, title, cities, images_urls')
  
  if (error || !locations) {
    console.error('Failed to get locations', error)
    return
  }

  const defaultLocs = locations.filter(loc => 
    loc.images_urls && loc.images_urls.length > 0 && loc.images_urls.some((url: string) => url.includes('unsplash.com'))
  );

  console.log(`Found ${defaultLocs.length} locations to process. Beginning search...`);
  
  let successCount = 0;

  for (const loc of defaultLocs) {
    console.log(`- Searching image for: ${loc.title}`);
    const imgUrl = await findWikiImage(loc.title || '', loc.cities);
    
    if (imgUrl) {
       console.log(`  -> Found: ${imgUrl}`);
       
       // Update db with new image url 
       // Keeping existing non-unsplash urls if any exist alongside it
       const cleanedUrls = loc.images_urls.filter((url: string) => !url.includes('unsplash.com'));
       cleanedUrls.unshift(imgUrl);
       
       const { error: updateErr } = await supabase.from('locations').update({ images_urls: cleanedUrls }).eq('id', loc.id);
       
       if (updateErr) {
           console.error(`  ❌ Failed to save ${loc.title} to DB`);
       } else {
           console.log(`  ✅ Updated DB`);
           successCount++;
       }
    } else {
       console.log(`  ⚪ No good image found on Wikimedia. Skipping.`);
    }

    // Rate limit prevention
    await sleep(2000);
  }
  
  console.log(`\n🎉 COMPLET! ${successCount}/${defaultLocs.length} imagini înlocuite cu succes.`);
}

run();
