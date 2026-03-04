import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "@/components/page-header";

describe("PageHeader", () => {
  it("renders title as h1", () => {
    render(<PageHeader title="Cases" description="Manage your cases" />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Cases");
  });

  it("renders description", () => {
    render(<PageHeader title="Cases" description="All active cases" />);
    expect(screen.getByText("All active cases")).toBeInTheDocument();
  });
});
