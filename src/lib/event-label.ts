import type { Event } from "./types";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Build a display label for an event, adding a prefix based on the date
 * property (e.g. "Birth of Darwin" instead of just "Darwin").
 */
export function eventDisplayName(event: Event): string {
  const name = capitalize(event.name);
  switch (event.dateProperty) {
    case "P569":
      return `Birth of ${name}`;
    case "P570":
      return `Death of ${name}`;
    case "P571": {
      const noun = event.type === "building" ? "Construction" : "Founding";
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
