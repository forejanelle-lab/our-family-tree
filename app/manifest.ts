import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Our Family Tree",
    short_name: "Family Tree",
    description: "A private family archive for portraits, stories, and the people who made you.",
    start_url: "/home",
    display: "standalone",
    background_color: "#F9F7F2",
    theme_color: "#F9F7F2",
    icons: [
      {
        src: "/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
