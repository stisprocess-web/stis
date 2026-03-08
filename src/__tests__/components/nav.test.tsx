import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Nav } from "@/components/nav";

describe("Nav", () => {
  it("renders all navigation links", () => {
    render(<Nav />);
    const expectedLabels = [
      "Dashboard", "Cases", "Clients", "Evidence", "Tasks",
      "Invoicing", "Team & 1099", "Reporting", "Video", "Ops",
      "Contracts", "Settings",
    ];
    for (const label of expectedLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders links with correct hrefs", () => {
    render(<Nav />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/cases");
    expect(hrefs).toContain("/clients");
    expect(hrefs).toContain("/evidence");
    expect(hrefs).toContain("/tasks");
    expect(hrefs).toContain("/invoicing");
    expect(hrefs).toContain("/team");
    expect(hrefs).toContain("/reporting");
    expect(hrefs).toContain("/video");
    expect(hrefs).toContain("/ops/daily");
    expect(hrefs).toContain("/contracts");
    expect(hrefs).toContain("/settings");
  });

  it("renders as a nav element", () => {
    render(<Nav />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("highlights Dashboard as active on root path", () => {
    render(<Nav />);
    // The mock usePathname returns "/"
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink?.className).toContain("bg-zinc-900");
  });
});
