import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TimelineMarker from "./TimelineMarker";
import { makeEvent } from "@/test-utils";

describe("TimelineMarker", () => {
  it("renders event name capitalized", () => {
    const marker = {
      event: makeEvent({ name: "the moon landing" }),
      label: "1969",
      position: 50,
    };
    render(<TimelineMarker marker={marker} />);
    expect(screen.getByText("The moon landing")).toBeInTheDocument();
  });

  it("renders date label", () => {
    const marker = {
      event: makeEvent({ name: "test" }),
      label: "Jul 1969",
      position: 50,
    };
    render(<TimelineMarker marker={marker} />);
    expect(screen.getByText("Jul 1969")).toBeInTheDocument();
  });

  it("renders as link when event has a link", () => {
    const marker = {
      event: makeEvent({ name: "test", link: "https://en.wikipedia.org/wiki/Test" }),
      label: "2000",
      position: 50,
    };
    render(<TimelineMarker marker={marker} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://en.wikipedia.org/wiki/Test");
  });

  it("renders as div when event has no link", () => {
    const marker = {
      event: makeEvent({ id: 5, name: "test", link: null }),
      label: "2000",
      position: 50,
    };
    render(<TimelineMarker marker={marker} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
