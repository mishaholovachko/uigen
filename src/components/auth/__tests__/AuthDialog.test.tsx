import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { AuthDialog } from "../AuthDialog";

// The auth hook hits server actions; stub it so the forms render in isolation.
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    signUp: vi.fn(),
    isLoading: false,
  }),
}));

afterEach(() => {
  cleanup();
});

test("does not render dialog content when closed", () => {
  render(<AuthDialog open={false} onOpenChange={vi.fn()} defaultMode="signin" />);

  expect(screen.queryByText("Welcome back")).toBeNull();
});

test("opens in signin mode", () => {
  render(<AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signin" />);

  expect(screen.getByText("Welcome back")).toBeDefined();
  expect(screen.getByText("Sign in to your account to continue")).toBeDefined();
});

test("opens in signup mode", () => {
  render(<AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />);

  expect(screen.getByText("Create an account")).toBeDefined();
});

// Regression test: reopening with the same defaultMode after toggling the mode
// inside the dialog must reset back to the requested mode.
test("re-syncs to defaultMode each time it reopens with the same mode", async () => {
  const user = userEvent.setup();

  // Mimics HeaderActions: a parent controlling `open` while defaultMode stays "signin".
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Open Sign In</button>
        <AuthDialog open={open} onOpenChange={setOpen} defaultMode="signin" />
      </>
    );
  }

  render(<Harness />);

  // First open → signin.
  await user.click(screen.getByText("Open Sign In"));
  expect(screen.getByText("Welcome back")).toBeDefined();

  // Toggle to signup inside the dialog.
  await user.click(screen.getByRole("button", { name: "Sign up" }));
  expect(screen.getByText("Create an account")).toBeDefined();

  // Close the dialog (Escape).
  await user.keyboard("{Escape}");

  // Reopen with the same "signin" defaultMode — it must show signin again,
  // not the previously toggled signup form.
  await user.click(screen.getByText("Open Sign In"));
  expect(screen.getByText("Welcome back")).toBeDefined();
  expect(screen.queryByText("Create an account")).toBeNull();
});
