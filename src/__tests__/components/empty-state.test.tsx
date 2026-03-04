import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/empty-state";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No cases found" />);
    expect(screen.getByText("No cases found")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="No cases" description="Try creating one" />);
    expect(screen.getByText("Try creating one")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    const { container } = render(<EmptyState title="Empty" />);
    const paragraphs = container.querySelectorAll("p");
    // No description paragraph when not provided
    expect(paragraphs).toHaveLength(0);
  });

  it("renders the default Inbox icon", () => {
    const { container } = render(<EmptyState title="Test" />);
    const svg = container.querySelector("svg.lucide-inbox");
    expect(svg).toBeInTheDocument();
  });
});
