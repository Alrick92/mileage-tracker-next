import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Mileage Tracker",
    short_name: "Mileage",
    description: "Multi-user vehicle fleet mileage tracker",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // No orientation lock: WCAG 1.3.4 asks content not to be restricted to a
    // single orientation, and tablets / car mounts are often landscape.
    background_color: "#fafafa",
    theme_color: "#ffffff",
    lang: "en",
    dir: "ltr",
    categories: ["productivity", "utilities", "business"],
    prefer_related_applications: false,
    // Long-press the home-screen icon to jump straight to these screens.
    shortcuts: [
      {
        name: "Log a trip",
        short_name: "Log trip",
        description: "Record a new trip",
        url: "/trips/new",
        icons: [{ src: "/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Trips",
        url: "/trips",
        icons: [{ src: "/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Vehicles",
        url: "/vehicles",
        icons: [{ src: "/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/maskable-icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
