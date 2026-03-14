import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import messages from "@/i18n/messages/en.json";

afterEach(() => {
  cleanup();
});

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, values?: Record<string, unknown>): string {
  if (!values) return template;
  let result = template;
  for (const [k, v] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  // Handle simple ICU plurals: {count, plural, one {# ...} other {# ...}}
  result = result.replace(/\{(\w+),\s*plural,\s*one\s*\{([^}]*)\}\s*other\s*\{([^}]*)\}\}/g, (_, key, one, other) => {
    const count = Number(values[key]);
    const template = count === 1 ? one : other;
    return template.replace(/#/g, String(count));
  });
  return result;
}

// Mock next-intl for component tests
vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => {
    const ns = namespace ? (messages as Record<string, Record<string, string>>)[namespace] || {} : {};
    const t = (key: string, values?: Record<string, unknown>) => {
      const raw = (ns as Record<string, string>)[key];
      if (raw) return interpolate(raw, values);
      // Fallback: return key
      return namespace ? `${namespace}.${key}` : key;
    };
    t.rich = (key: string, values?: Record<string, unknown>) => {
      const raw = (ns as Record<string, string>)[key];
      if (!raw) return namespace ? `${namespace}.${key}` : key;
      // For rich text, strip tags and just return the text
      let result = raw;
      if (values) {
        for (const [k, v] of Object.entries(values)) {
          if (typeof v === "function") {
            // Replace <tag>content</tag> with just the content processed by the function
            const tagRegex = new RegExp(`<${k}>([^<]*)</${k}>`, "g");
            result = result.replace(tagRegex, (_, content) => String(v(content)));
          } else {
            result = result.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
          }
        }
      }
      return result;
    };
    return t;
  },
  useLocale: () => "en",
}));

// Mock next/navigation for components that use useRouter/usePathname
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));
