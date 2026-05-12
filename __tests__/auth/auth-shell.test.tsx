import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
  }),
}));

import LoginPage from "@/app/auth/login/page";

describe("LoginPage", () => {
  it("renders the auth shell and the login entry points", () => {
    render(<LoginPage />);

    expect(screen.getByText(/Sign in with a controlled auth flow/i)).toBeInTheDocument();
    expect(screen.getByText(/Email\/password and Google entry points/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Log in/i })).toBeInTheDocument();
  });
});