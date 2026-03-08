import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Sentence from "./Sentence";

describe("Sentence", () => {
  it("renders sentence text as a link", () => {
    render(<Sentence text="Hello world" href="/123" />);
    const link = screen.getByRole("link", { name: "Hello world" });
    expect(link).toHaveAttribute("href", "/123");
  });

  it("returns null when text is empty", () => {
    const { container } = render(<Sentence text="" href="/123" />);
    expect(container.innerHTML).toBe("");
  });

  it("copy button calls navigator.clipboard.writeText", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<Sentence text="Hello" href="/test" />);
    fireEvent.click(screen.getByLabelText("Copy link"));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/test`);
  });

  it("shows download button when onExport is provided", () => {
    const onExport = vi.fn();
    render(<Sentence text="Hello" href="/test" onExport={onExport} />);
    const btn = screen.getByLabelText("Download as image");
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onExport).toHaveBeenCalled();
  });

  it("hides download button when onExport is not provided", () => {
    render(<Sentence text="Hello" href="/test" />);
    expect(screen.queryByLabelText("Download as image")).not.toBeInTheDocument();
  });
});
