import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://wiki.closerinti.me",
      priority: 1.0,
    },
  ];
}
