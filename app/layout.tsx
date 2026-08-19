import type { Metadata, Viewport } from "next";
import "./globals.css";

const canonical = "https://realitydiffusion.ai";

export const metadata: Metadata = {
  metadataBase: new URL(canonical),
  title: {
    default: "Reality Diffusion — Synthetic Media Intelligence",
    template: "%s | Reality Diffusion",
  },
  description:
    "A practical evidence protocol for understanding and verifying synthetic media—without uploading the material.",
  manifest: "/manifest.webmanifest",
  alternates: { canonical },
  openGraph: {
    title: "Reality Diffusion — Synthetic Media Intelligence",
    description:
      "Move from impression to evidence with a private, local-only Reality Check.",
    url: canonical,
    siteName: "Reality Diffusion",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Reality Diffusion — Evidence is a practice" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reality Diffusion — Synthetic Media Intelligence",
    description: "Synthetic media demands an evidence practice.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f2efe7",
  colorScheme: "light",
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Reality Diffusion",
  url: canonical,
  description:
    "Synthetic-media intelligence for understanding, creating, and verifying AI-mediated media.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
        {/* Static, source-controlled schema only; no user or remote input enters this JSON-LD. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </body>
    </html>
  );
}
