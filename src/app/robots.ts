import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/builds", "/downloads", "/uzivatele", "/app"],
    },
    sitemap: "https://www.jpsoft.online/sitemap.xml",
    host: "https://www.jpsoft.online",
  };
}
