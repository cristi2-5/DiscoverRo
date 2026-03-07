import { getLocations, getLocationsSortedByDistance } from "@/lib/actions/locations";
import { HomeClient } from "@/app/HomeClient";
import { createClient } from "@/utils/supabase/server";

// Add dynamic config to avoid Next.js caching issues on this page
// if we want locations to be updated immediately after insertion in DB
export const dynamic = 'force-dynamic'

export default async function Home(props: { searchParams: Promise<{ category?: string; sort?: string; lat?: string; lon?: string }> }) {
  const searchParams = await props.searchParams;
  const category = searchParams.category || 'Toate';
  const sort = searchParams.sort || 'views';
  const lat = searchParams.lat ? parseFloat(searchParams.lat) : null;
  const lon = searchParams.lon ? parseFloat(searchParams.lon) : null;

  let locations = [];
  if (lat && lon) {
     locations = await getLocationsSortedByDistance(lat, lon);
     // Apply category filtering manually on the server if using distance RPC
     if (category !== 'Toate') {
       locations = locations.filter((loc: { category: string | null }) => loc.category === category);
     }
  } else {
     locations = await getLocations(category, sort);
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let savedIds: string[] = [];
  if (user) {
    const { data } = await supabase
      .from('planner_items')
      .select('location_id')
      .eq('user_id', user.id);
    if (data) {
      savedIds = data.map(d => d.location_id).filter(id => id !== null) as string[];
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <HomeClient 
        initialLocations={locations || []} 
        savedIds={savedIds} 
        initialCategory={category}
        initialSort={sort}
      />
    </main>
  );
}
