import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "معاملات سامانه رویال شمش",
    short_name: "رویال شمش",
    description: "سامانه معاملات طلا و شمش رویال شمش",
    start_url: "/royal-shemsh/",
    display: "standalone",
    background_color: "#0B0E14",
    theme_color: "#D4AF37",
    dir: "rtl",
    lang: "fa",
    icons: [
      {
        src: "/royal-shemsh/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/royal-shemsh/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
