import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reality Diffusion — Synthetic Media Intelligence",
    short_name: "Reality Diffusion",
    description: "A private-in-the-browser evidence protocol for synthetic media.",
    start_url: "/",
    display: "standalone",
    background_color: "#f2efe7",
    theme_color: "#17261f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
