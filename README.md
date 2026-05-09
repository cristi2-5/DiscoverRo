# DiscoverRo

DiscoverRo is a web application designed to help users explore the best tourist destinations in Romania. The app makes it easy to find beautiful locations, historic sites, and natural wonders, and automatically generates smart itineraries to help you plan your trips.

## What it does

- **Explore Top Destinations**: Browse through carefully curated points of interest (POIs) across Romania's top 50 cities and tourist regions.
- **Interactive Maps**: View locations on an interactive map.
- **Smart Itineraries**: The app automatically groups nearby locations and calculates the best route between them, creating manageable travel clusters so you don't have to plan everything manually.
- **Rich Information**: Get quick summaries and pictures of places sourced automatically from Wikipedia and OpenStreetMap.

## Technologies Used

This project was built using modern web development tools:

- **Next.js & React**: The core framework used to build the user interface and handle routing.
- **Tailwind CSS**: Used for styling the application quickly and making it responsive on all devices.
- **Supabase**: Our cloud database and backend. It securely stores all the locations, routes, and user data.
- **Leaflet & React-Leaflet**: The map library used to display interactive maps and draw routes between destinations.
- **TypeScript**: Used throughout the project to ensure the code is robust and error-free.

## How the data was gathered

The locations were gathered using a custom data scraper that:
1. Queries **OpenStreetMap (Overpass API)** to find relevant tourist attractions (parks, museums, castles, etc.).
2. Connects to **Wikipedia** and **Wikimedia Commons** to fetch descriptions and high-quality thumbnail images for each location.
3. Saves everything securely into our **Supabase** database.

## Getting Started

To run the project locally, install the dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app running.
