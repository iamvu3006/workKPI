import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LoginPage from "@/app/auth/login/page";

describe("LoginPage", () => {
  it("collapses the marketing rail on mobile-sized auth layouts", () => {
    render(<LoginPage />);

    expect(screen.queryByText(/Email\/password and Google entry points/i)).not.toBeInTheDocument();
  });
});