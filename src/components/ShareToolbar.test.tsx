import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ShareToolbar from "./ShareToolbar";

describe("ShareToolbar", () => {
  it("copy button calls navigator.clipboard.writeText", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<ShareToolbar href="/test" />);
    fireEvent.click(screen.getByLabelText("Copy link"));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/test`);
  });

  it("shows download button when onExport is provided", () => {
    const onExport = vi.fn();
    render(<ShareToolbar href="/test" onExport={onExport} />);
    const btn = screen.getByLabelText("Download as image");
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onExport).toHaveBeenCalled();
  });

  it("hides download button when onExport is not provided", () => {
    render(<ShareToolbar href="/test" />);
    expect(screen.queryByLabelText("Download as image")).not.toBeInTheDocument();
  });

  it("shows share button when navigator.share is available", () => {
    Object.assign(navigator, { share: vi.fn() });
    render(<ShareToolbar href="/test" />);
    expect(screen.getByLabelText("Share")).toBeInTheDocument();
  });

  it("hides share button when navigator.share is unavailable", () => {
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    render(<ShareToolbar href="/test" />);
    expect(screen.queryByLabelText("Share")).not.toBeInTheDocument();
  });
});
