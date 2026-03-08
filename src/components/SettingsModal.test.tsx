import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SettingsModal from "./SettingsModal";

function renderModal(overrides = {}) {
  const props = {
    timespanFormat: 2 as const,
    onSave: vi.fn(),
    theme: "system" as const,
    onThemeChange: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<SettingsModal {...props} />);
  return props;
}

describe("SettingsModal", () => {
  it("renders three timespan format radio options", () => {
    renderModal();
    expect(screen.getByLabelText("Days")).toBeInTheDocument();
    expect(screen.getByLabelText("Years only")).toBeInTheDocument();
    expect(screen.getByLabelText("Precise (years, months, days)")).toBeInTheDocument();
  });

  it("renders three theme radio options", () => {
    renderModal();
    expect(screen.getByLabelText("System")).toBeInTheDocument();
    expect(screen.getByLabelText("Light")).toBeInTheDocument();
    expect(screen.getByLabelText("Dark")).toBeInTheDocument();
  });

  it("save calls onSave with selected format and onThemeChange", () => {
    const props = renderModal();
    fireEvent.click(screen.getByLabelText("Days"));
    fireEvent.click(screen.getByLabelText("Dark"));
    fireEvent.click(screen.getByText("Save"));
    expect(props.onSave).toHaveBeenCalledWith(0);
    expect(props.onThemeChange).toHaveBeenCalledWith("dark");
    expect(props.onClose).toHaveBeenCalled();
  });

  it("cancel calls onClose", () => {
    const props = renderModal();
    fireEvent.click(screen.getByText("Cancel"));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("escape key calls onClose", () => {
    const props = renderModal();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onClose).toHaveBeenCalled();
  });

  it("overlay click calls onClose", () => {
    const props = renderModal();
    // The overlay wraps the modal; it's the outermost rendered element
    const modal = screen.getByText("Settings").closest("[class*='modal']")!;
    const overlay = modal.parentElement!;
    fireEvent.click(overlay);
    expect(props.onClose).toHaveBeenCalled();
  });
});
