async function findWikiImage(title: string) {
  try {
    // 1. Search for closest image on Wikimedia Commons
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=${encodeURIComponent(title)}&utf8=&format=json`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    if (!searchData.query.search || searchData.query.search.length === 0) return null;
    
    // Get the first file title, e.g. "File:Cazinoul Sinaia.jpg"
    const fileTitle = searchData.query.search[0].title;
    
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
  const titles = ['Turnul Sfatului Sibiu', 'Cota 1400', 'Cazinoul Sinaia', 'Castelul Peleș', 'Piața Mare Sibiu'];
  for (const t of titles) {
    const img = await findWikiImage(t);
    console.log(`${t} -> ${img}`);
  }
}

run();
