import type { Event } from "./types";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type TranslateFunc = (key: string, values?: Record<string, string>) => string;

/**
 * Build a display label for an event, adding a prefix based on the date
 * property (e.g. "Birth of Darwin" instead of just "Darwin").
 *
 * When called without a `t` function, uses hardcoded English strings
 * (for OG images and non-React contexts).
 */
export function eventDisplayName(event: Event, t?: TranslateFunc): string {
  const name = capitalize(event.name);

  if (t) {
    switch (event.dateProperty) {
      case "P569":
        return t("birthOf", { name });
      case "P570":
        return t("deathOf", { name });
      case "P571": {
        const key =
          event.type === "building" ? "constructionOf" :
          event.type === "position" || event.type === "state" ? "establishmentOf" :
          event.type === "music" || event.type === "organization" ? "formationOf" :
          "foundingOf";
        return t(key, { name });
      }
      case "P577": {
        const key = event.type === "film" || event.type === "music" ? "releaseOf" : "publicationOf";
        return t(key, { name });
      }
      case "P619":
        return t("launchOf", { name });
      case "P620":
        return t("landingOf", { name });
      case "P1191":
        return t("firstPerformanceOf", { name });
      case "P606":
        return t("firstFlightOf", { name });
      default:
        return name;
    }
  }

  // Fallback English strings (for OG images and non-React contexts)
  switch (event.dateProperty) {
    case "P569":
      return `Birth of ${name}`;
    case "P570":
      return `Death of ${name}`;
    case "P571": {
      const noun =
        event.type === "building" ? "Construction" :
        event.type === "position" || event.type === "state" ? "Establishment" :
        event.type === "music" || event.type === "organization" ? "Formation" :
        "Founding";
      return `${noun} of ${name}`;
    }
    case "P577": {
      const noun = event.type === "film" || event.type === "music" ? "Release" : "Publication";
      return `${noun} of ${name}`;
    }
    case "P619":
      return `Launch of ${name}`;
    case "P620":
      return `Landing of ${name}`;
    case "P1191":
      return `First performance of ${name}`;
    case "P606":
      return `First flight of ${name}`;
    default:
      return name;
  }
}
