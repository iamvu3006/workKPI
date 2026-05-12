import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const refresh = vi.fn();
const signInWithPassword = vi.fn();
const signInWithOAuth = vi.fn();
const resetPasswordForEmail = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
    refresh,
  }),
}));

vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword,
      signInWithOAuth,
      resetPasswordForEmail,
    },
  }),
}));

import { ForgotPasswordForm } from "@/app/auth/forgot-password/forgot-password-form";
import { LoginForm } from "@/app/auth/login/login-form";

beforeEach(() => {
  replace.mockReset();
  refresh.mockReset();
  signInWithPassword.mockReset();
  signInWithOAuth.mockReset();
  resetPasswordForEmail.mockReset();
});

describe("LoginForm", () => {
  it("blocks invalid sign-in emails before calling Supabase", async () => {
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "not-an-email" },
    });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), {
      target: { value: "Password123!" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Đăng nhập" }).closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(signInWithPassword).not.toHaveBeenCalled();
    });

    expect(screen.getByText(/enter a valid company email/i)).toBeInTheDocument();
  });

  it("surfaces a friendly Google SSO error state", async () => {
    signInWithOAuth.mockResolvedValueOnce({
      error: { message: "popup_closed_by_user" },
    });

    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập bằng Google" }));

    await waitFor(() => {
      expect(screen.getByText(/Google sign-in failed/i)).toBeInTheDocument();
    });
  });
});

describe("ForgotPasswordForm", () => {
  it("blocks invalid reset emails before requesting a reset link", async () => {
    render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "bad-email" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Send reset link" }).closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(resetPasswordForEmail).not.toHaveBeenCalled();
    });

    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
  });
});