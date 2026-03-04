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
    // Only the title paragraph
    expect(paragraphs).toHaveLength(1);
  });

  it("renders the mailbox emoji icon", () => {
    render(<EmptyState title="Test" />);
    expect(screen.getByText("📭")).toBeInTheDocument();
  });
});
