import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
      event: makeEvent({ id: "Q5", name: "test", link: null }),
      label: "2000",
      position: 50,
    };
    render(<TimelineMarker marker={marker} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders remove button when onRemove is provided", () => {
    const onRemove = vi.fn();
    const marker = {
      event: makeEvent({ id: "Q5", name: "test" }),
      label: "2000",
      position: 50,
    };
    render(<TimelineMarker marker={marker} onRemove={onRemove} />);
    const btn = screen.getByLabelText("Remove event");
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onRemove).toHaveBeenCalled();
  });

  it("does not render remove button when onRemove is not provided", () => {
    const marker = {
      event: makeEvent({ id: "Q5", name: "test" }),
      label: "2000",
      position: 50,
    };
    render(<TimelineMarker marker={marker} />);
    expect(screen.queryByLabelText("Remove event")).not.toBeInTheDocument();
  });

  it("renders toggle death button for person events with deathYear", () => {
    const onToggleDeath = vi.fn();
    const marker = {
      event: makeEvent({ id: "Q5", name: "Einstein", deathYear: 1955, dateProperty: "P569" }),
      label: "1879",
      position: 50,
    };
    render(<TimelineMarker marker={marker} onToggleDeath={onToggleDeath} />);
    const btn = screen.getByLabelText("Switch to death date");
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onToggleDeath).toHaveBeenCalled();
  });

  it("does not render toggle death button when event has no deathYear", () => {
    const onToggleDeath = vi.fn();
    const marker = {
      event: makeEvent({ id: "Q5", name: "test" }),
      label: "2000",
      position: 50,
    };
    render(<TimelineMarker marker={marker} onToggleDeath={onToggleDeath} />);
    expect(screen.queryByLabelText("Switch to death date")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Switch to birth date")).not.toBeInTheDocument();
  });
});
