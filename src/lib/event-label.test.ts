import { describe, it, expect } from "vitest";
import { eventDisplayName } from "./event-label";
import { makeEvent } from "@/test-utils";

describe("eventDisplayName", () => {
  it("returns capitalized name for unknown property", () => {
    expect(eventDisplayName(makeEvent({ name: "test event" }))).toBe("Test event");
  });

  it("adds Birth prefix for P569", () => {
    expect(eventDisplayName(makeEvent({ name: "darwin", dateProperty: "P569" }))).toBe("Birth of Darwin");
  });

  it("adds Death prefix for P570", () => {
    expect(eventDisplayName(makeEvent({ name: "darwin", dateProperty: "P570" }))).toBe("Death of Darwin");
  });

  it("adds Construction prefix for P571 building", () => {
    expect(eventDisplayName(makeEvent({ name: "colosseum", dateProperty: "P571", type: "building" }))).toBe("Construction of Colosseum");
  });

  it("adds Founding prefix for P571 other types", () => {
    expect(eventDisplayName(makeEvent({ name: "rome", dateProperty: "P571", type: "place" }))).toBe("Founding of Rome");
  });

  it("adds Release prefix for P577 film", () => {
    expect(eventDisplayName(makeEvent({ name: "star wars", dateProperty: "P577", type: "film" }))).toBe("Release of Star wars");
  });

  it("adds Publication prefix for P577 book", () => {
    expect(eventDisplayName(makeEvent({ name: "don quixote", dateProperty: "P577", type: "book" }))).toBe("Publication of Don quixote");
  });
});

describe("eventDisplayName with translation function", () => {
  const italianT = (key: string, values?: Record<string, string>) => {
    const templates: Record<string, string> = {
      birthOf: "Nascita di {name}",
      deathOf: "Morte di {name}",
      constructionOf: "Costruzione di {name}",
      foundingOf: "Fondazione di {name}",
      releaseOf: "Uscita di {name}",
      publicationOf: "Pubblicazione di {name}",
      launchOf: "Lancio di {name}",
      landingOf: "Atterraggio di {name}",
      firstPerformanceOf: "Prima rappresentazione di {name}",
      firstFlightOf: "Primo volo di {name}",
      establishmentOf: "Istituzione di {name}",
    };
    const template = templates[key] ?? key;
    return values ? template.replace("{name}", values.name) : template;
  };

  it("translates birth prefix", () => {
    expect(eventDisplayName(makeEvent({ name: "darwin", dateProperty: "P569" }), italianT)).toBe("Nascita di Darwin");
  });

  it("translates death prefix", () => {
    expect(eventDisplayName(makeEvent({ name: "cleopatra", dateProperty: "P570" }), italianT)).toBe("Morte di Cleopatra");
  });

  it("translates construction prefix for buildings", () => {
    expect(eventDisplayName(makeEvent({ name: "colosseo", dateProperty: "P571", type: "building" }), italianT)).toBe("Costruzione di Colosseo");
  });

  it("translates founding prefix for other types", () => {
    expect(eventDisplayName(makeEvent({ name: "roma", dateProperty: "P571", type: "place" }), italianT)).toBe("Fondazione di Roma");
  });

  it("translates release prefix for film", () => {
    expect(eventDisplayName(makeEvent({ name: "la dolce vita", dateProperty: "P577", type: "film" }), italianT)).toBe("Uscita di La dolce vita");
  });

  it("translates launch prefix", () => {
    expect(eventDisplayName(makeEvent({ name: "sputnik 1", dateProperty: "P619" }), italianT)).toBe("Lancio di Sputnik 1");
  });

  it("translates first flight prefix", () => {
    expect(eventDisplayName(makeEvent({ name: "concorde", dateProperty: "P606" }), italianT)).toBe("Primo volo di Concorde");
  });

  it("returns capitalized name for unknown property", () => {
    expect(eventDisplayName(makeEvent({ name: "test" }), italianT)).toBe("Test");
  });
});
