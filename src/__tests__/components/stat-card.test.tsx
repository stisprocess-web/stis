import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "@/components/stat-card";

describe("StatCard", () => {
  it("renders label and value", () => {
    render(<StatCard label="Active Cases" value="12" />);
    expect(screen.getByText("Active Cases")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders hint when provided", () => {
    render(<StatCard label="Revenue" value="$50,000" hint="Last 30 days" />);
    expect(screen.getByText("Last 30 days")).toBeInTheDocument();
  });

  it("does not render hint when not provided", () => {
    const { container } = render(<StatCard label="Tasks" value="5" />);
    const paragraphs = container.querySelectorAll("p");
    // label + value = 2 paragraphs, no hint
    expect(paragraphs).toHaveLength(2);
  });
});
