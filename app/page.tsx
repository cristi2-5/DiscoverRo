import { getLocations } from "@/lib/actions/locations";
import { HomeClient } from "@/app/HomeClient";

// Add dynamic config to avoid Next.js caching issues on this page
// if we want locations to be updated immediately after insertion in DB
export const dynamic = 'force-dynamic'

export default async function Home() {
  const locations = await getLocations();

  return (
    <main className="min-h-screen bg-gray-50">
      <HomeClient initialLocations={locations || []} />
    </main>
  );
}
