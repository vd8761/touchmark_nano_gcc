import type { MetadataRoute } from "next";
import { SITE_URL } from "./sitemap";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The admin panel, the API surface and individual payment receipts have
      // no business in a search index.
      disallow: ["/admin", "/api", "/membership"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
