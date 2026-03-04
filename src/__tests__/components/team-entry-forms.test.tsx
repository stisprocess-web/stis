import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TeamEntryForms } from "@/components/team-entry-forms";

describe("TeamEntryForms", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders time entry and expense forms", () => {
    render(<TeamEntryForms />);
    expect(screen.getByText("Log Time Entry")).toBeInTheDocument();
    expect(screen.getByText("Log Expense")).toBeInTheDocument();
  });

  it("renders Save Time Entry button", () => {
    render(<TeamEntryForms />);
    expect(screen.getByRole("button", { name: "Save Time Entry" })).toBeInTheDocument();
  });

  it("renders Save Expense button", () => {
    render(<TeamEntryForms />);
    expect(screen.getByRole("button", { name: "Save Expense" })).toBeInTheDocument();
  });

  it("renders expense category select with options", () => {
    render(<TeamEntryForms />);
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual([
      "Mileage", "Lodging", "Meals", "Equipment", "Other",
    ]);
  });

  it("shows success message on successful time entry submission", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    render(<TeamEntryForms />);
    const user = userEvent.setup();

    const timeForm = screen.getByText("Log Time Entry").closest("form")!;
    const caseInput = timeForm.querySelector('input#te-caseId') as HTMLInputElement;
    await user.type(caseInput, "ca1");
    const contractorInput = timeForm.querySelector('input#te-contractorId') as HTMLInputElement;
    await user.type(contractorInput, "ct1");
    const dateInput = timeForm.querySelector('input[type="date"]') as HTMLInputElement;
    await user.type(dateInput, "2024-01-15");
    const hoursInput = timeForm.querySelector('input#te-hours') as HTMLInputElement;
    await user.type(hoursInput, "2");
    const billableInput = timeForm.querySelector('input#te-billable') as HTMLInputElement;
    await user.type(billableInput, "250");

    await user.click(screen.getByRole("button", { name: "Save Time Entry" }));

    expect(await screen.findByText("Time entry saved successfully.")).toBeInTheDocument();
  });

  it("shows error message on failed time entry submission", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { formErrors: ["Validation failed"] } }),
    });

    render(<TeamEntryForms />);
    const user = userEvent.setup();

    const timeForm = screen.getByText("Log Time Entry").closest("form")!;
    const caseInput = timeForm.querySelector('input#te-caseId') as HTMLInputElement;
    await user.type(caseInput, "ca1");
    const contractorInput = timeForm.querySelector('input#te-contractorId') as HTMLInputElement;
    await user.type(contractorInput, "ct1");
    const dateInput = timeForm.querySelector('input[type="date"]') as HTMLInputElement;
    await user.type(dateInput, "2024-01-15");
    const hoursInput = timeForm.querySelector('input#te-hours') as HTMLInputElement;
    await user.type(hoursInput, "2");
    const billableInput = timeForm.querySelector('input#te-billable') as HTMLInputElement;
    await user.type(billableInput, "250");

    await user.click(screen.getByRole("button", { name: "Save Time Entry" }));

    expect(await screen.findByText("Validation failed")).toBeInTheDocument();
  });

  it("shows network error on fetch failure for expense", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error. Please try again."));

    render(<TeamEntryForms />);
    const user = userEvent.setup();

    const expenseForm = screen.getByText("Log Expense").closest("form")!;
    const caseInput = expenseForm.querySelector('input#ex-caseId') as HTMLInputElement;
    await user.type(caseInput, "ca1");
    const contractorInput = expenseForm.querySelector('input#ex-contractorId') as HTMLInputElement;
    await user.type(contractorInput, "ct1");
    const dateInput = expenseForm.querySelector('input[type="date"]') as HTMLInputElement;
    await user.type(dateInput, "2024-01-15");
    const amountInput = expenseForm.querySelector('input#ex-amount') as HTMLInputElement;
    await user.type(amountInput, "50");

    await user.click(screen.getByRole("button", { name: "Save Expense" }));

    expect(await screen.findByText("Network error. Please try again.")).toBeInTheDocument();
  });
});
