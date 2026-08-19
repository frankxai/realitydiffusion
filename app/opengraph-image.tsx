import { ImageResponse } from "next/og";

export const alt = "Reality Diffusion — Evidence is a practice";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "64px",
        background: "#f2efe7",
        color: "#17261f",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Arial, sans-serif", fontSize: 20, letterSpacing: 3, textTransform: "uppercase" }}>
        <span>Reality Diffusion</span>
        <span style={{ color: "#9f402b" }}>Synthetic media intelligence</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 56 }}>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 850 }}>
          <span style={{ fontSize: 104, lineHeight: 0.95, letterSpacing: -5 }}>Evidence is a practice.</span>
          <span style={{ marginTop: 28, fontFamily: "Arial, sans-serif", fontSize: 26, lineHeight: 1.45, color: "#425149" }}>
            Trace the source. Test the context. Preserve provenance.
          </span>
        </div>
        <div style={{ width: 180, height: 180, border: "2px solid #17261f", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 76, height: 76, border: "2px solid #d35e3f", borderRadius: "50%", background: "#17261f", color: "#f2efe7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38 }}>?</div>
        </div>
      </div>
      <div style={{ height: 2, width: "100%", background: "#17261f" }} />
    </div>,
    size,
  );
}
