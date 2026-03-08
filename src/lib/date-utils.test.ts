import { describe, it, expect } from "vitest";
import {
  createUTCDate,
  diffYears,
  diffDays,
  isBefore,
  daysInMonth,
  preciseDiff,
  formatYear,
  formatEventDate,
  formatSpan,
} from "./date-utils";

describe("createUTCDate", () => {
  it("creates a date with specific year, month, day at noon UTC", () => {
    const d = createUTCDate(2000, 0, 15);
    expect(d.getUTCFullYear()).toBe(2000);
    expect(d.getUTCMonth()).toBe(0);
    expect(d.getUTCDate()).toBe(15);
    expect(d.getUTCHours()).toBe(12);
  });

  it("handles year 0 correctly", () => {
    const d = createUTCDate(0, 0, 1);
    expect(d.getUTCFullYear()).toBe(0);
  });

  it("handles negative (B.C.) years", () => {
    const d = createUTCDate(-500, 0, 1);
    expect(d.getUTCFullYear()).toBe(-500);
  });

  it("handles two-digit years without JS century mapping", () => {
    const d = createUTCDate(50, 5, 10);
    expect(d.getUTCFullYear()).toBe(50);
    expect(d.getUTCMonth()).toBe(5);
  });

  it("creates date with only year specified (uses current month/day)", () => {
    const d = createUTCDate(1999);
    expect(d.getUTCFullYear()).toBe(1999);
  });
});

describe("diffYears", () => {
  it("returns the absolute year difference", () => {
    const d1 = createUTCDate(2000, 0, 1);
    const d2 = createUTCDate(2020, 0, 1);
    expect(diffYears(d1, d2)).toBe(20);
  });

  it("is commutative (absolute value)", () => {
    const d1 = createUTCDate(1990, 0, 1);
    const d2 = createUTCDate(2000, 0, 1);
    expect(diffYears(d1, d2)).toBe(diffYears(d2, d1));
  });

  it("returns 0 for same year", () => {
    const d1 = createUTCDate(2023, 0, 1);
    const d2 = createUTCDate(2023, 11, 31);
    expect(diffYears(d1, d2)).toBe(0);
  });

  it("handles B.C. to A.D. span", () => {
    const d1 = createUTCDate(-100, 0, 1);
    const d2 = createUTCDate(100, 0, 1);
    expect(diffYears(d1, d2)).toBe(200);
  });
});

describe("diffDays", () => {
  it("returns the absolute day difference", () => {
    const d1 = createUTCDate(2020, 0, 1);
    const d2 = createUTCDate(2020, 0, 11);
    expect(diffDays(d1, d2)).toBe(10);
  });

  it("is commutative", () => {
    const d1 = createUTCDate(2020, 0, 1);
    const d2 = createUTCDate(2020, 6, 1);
    expect(diffDays(d1, d2)).toBe(diffDays(d2, d1));
  });

  it("returns 0 for same date", () => {
    const d1 = createUTCDate(2020, 5, 15);
    const d2 = createUTCDate(2020, 5, 15);
    expect(diffDays(d1, d2)).toBe(0);
  });

  it("handles leap year correctly", () => {
    const d1 = createUTCDate(2020, 0, 1);
    const d2 = createUTCDate(2021, 0, 1);
    expect(diffDays(d1, d2)).toBe(366);
  });

  it("handles non-leap year correctly", () => {
    const d1 = createUTCDate(2019, 0, 1);
    const d2 = createUTCDate(2020, 0, 1);
    expect(diffDays(d1, d2)).toBe(365);
  });
});

describe("isBefore", () => {
  it("returns true when d1 is before d2", () => {
    const d1 = createUTCDate(2000, 0, 1);
    const d2 = createUTCDate(2001, 0, 1);
    expect(isBefore(d1, d2)).toBe(true);
  });

  it("returns false when d1 is after d2", () => {
    const d1 = createUTCDate(2001, 0, 1);
    const d2 = createUTCDate(2000, 0, 1);
    expect(isBefore(d1, d2)).toBe(false);
  });

  it("returns false for equal dates", () => {
    const d1 = createUTCDate(2000, 0, 1);
    const d2 = createUTCDate(2000, 0, 1);
    expect(isBefore(d1, d2)).toBe(false);
  });
});

describe("daysInMonth", () => {
  it("returns 31 for January", () => {
    expect(daysInMonth(2020, 0)).toBe(31);
  });

  it("returns 28 for February in a non-leap year", () => {
    expect(daysInMonth(2019, 1)).toBe(28);
  });

  it("returns 29 for February in a leap year", () => {
    expect(daysInMonth(2020, 1)).toBe(29);
  });

  it("returns 30 for April", () => {
    expect(daysInMonth(2020, 3)).toBe(30);
  });

  it("returns 28 for February in a century non-leap year", () => {
    expect(daysInMonth(1900, 1)).toBe(28);
  });

  it("returns 29 for February in a 400-year leap year", () => {
    expect(daysInMonth(2000, 1)).toBe(29);
  });
});

describe("preciseDiff", () => {
  it("returns '0 days' for identical dates", () => {
    const d = createUTCDate(2020, 0, 1);
    expect(preciseDiff(d, d)).toBe("0 days");
  });

  it("returns correct diff for years only", () => {
    const d1 = createUTCDate(2018, 0, 1);
    const d2 = createUTCDate(2020, 0, 1);
    expect(preciseDiff(d1, d2)).toBe("2 years");
  });

  it("returns correct diff for months only", () => {
    const d1 = createUTCDate(2020, 0, 1);
    const d2 = createUTCDate(2020, 3, 1);
    expect(preciseDiff(d1, d2)).toBe("3 months");
  });

  it("returns correct diff for days only", () => {
    const d1 = createUTCDate(2020, 0, 1);
    const d2 = createUTCDate(2020, 0, 16);
    expect(preciseDiff(d1, d2)).toBe("15 days");
  });

  it("returns combined years, months, and days", () => {
    const d1 = createUTCDate(2018, 0, 1);
    const d2 = createUTCDate(2020, 3, 16);
    expect(preciseDiff(d1, d2)).toBe("2 years, 3 months and 15 days");
  });

  it("uses singular forms correctly", () => {
    const d1 = createUTCDate(2020, 0, 1);
    const d2 = createUTCDate(2021, 1, 2);
    expect(preciseDiff(d1, d2)).toBe("1 year, 1 month and 1 day");
  });

  it("is commutative (swaps dates if needed)", () => {
    const d1 = createUTCDate(2020, 0, 1);
    const d2 = createUTCDate(2022, 6, 15);
    expect(preciseDiff(d1, d2)).toBe(preciseDiff(d2, d1));
  });

  it("handles years and days (no months)", () => {
    const d1 = createUTCDate(2020, 0, 1);
    const d2 = createUTCDate(2021, 0, 6);
    expect(preciseDiff(d1, d2)).toBe("1 year and 5 days");
  });
});

describe("formatYear", () => {
  it("formats positive years as strings", () => {
    expect(formatYear(2020)).toBe("2020");
  });

  it("formats negative years with B.C.", () => {
    expect(formatYear(-500)).toBe("500 B.C.");
  });

  it("formats year 0", () => {
    expect(formatYear(0)).toBe("0");
  });
});

describe("formatEventDate", () => {
  it("formats event with full date", () => {
    const result = formatEventDate({ year: 2020, month: 7, day: 4 });
    expect(result).toContain("2020");
    expect(result).toContain("July");
    expect(result).toContain("4");
  });

  it("formats event with year only when month is null", () => {
    expect(formatEventDate({ year: 1990, month: null, day: null })).toBe("1990");
  });

  it("formats event with year only when day is null", () => {
    expect(formatEventDate({ year: 1990, month: 6, day: null })).toBe("1990");
  });

  it("formats B.C. event year", () => {
    expect(formatEventDate({ year: -2600, month: null, day: null })).toBe("2600 B.C.");
  });
});

describe("formatSpan", () => {
  it("formats as years when yearsOnly is true", () => {
    const d1 = createUTCDate(2000, 0, 1);
    const d2 = createUTCDate(2020, 0, 1);
    expect(formatSpan(d1, d2, true, 2)).toBe("20 years");
  });

  it("formats as years when timespanFormat is 1", () => {
    const d1 = createUTCDate(2000, 0, 1);
    const d2 = createUTCDate(2020, 0, 1);
    expect(formatSpan(d1, d2, false, 1)).toBe("20 years");
  });

  it("formats as precise diff when timespanFormat is 2", () => {
    const d1 = createUTCDate(2018, 0, 1);
    const d2 = createUTCDate(2020, 3, 16);
    expect(formatSpan(d1, d2, false, 2)).toBe("2 years, 3 months and 15 days");
  });

  it("formats as days when timespanFormat is 0", () => {
    const d1 = createUTCDate(2020, 0, 1);
    const d2 = createUTCDate(2020, 0, 11);
    expect(formatSpan(d1, d2, false, 0)).toBe("10 days");
  });

  it("uses singular 'year' for 1 year", () => {
    const d1 = createUTCDate(2019, 0, 1);
    const d2 = createUTCDate(2020, 0, 1);
    expect(formatSpan(d1, d2, true, 1)).toBe("1 year");
  });
});
