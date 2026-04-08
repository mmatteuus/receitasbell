// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UserLoginPage from "./UserLoginPage";

const startSocialLoginMock = vi.fn();

vi.mock("@/lib/api/socialAuth", () => ({
  startSocialLogin: (...args: unknown[]) => startSocialLoginMock(...args),
}));

vi.mock("@/components/PageHead", () => ({
  PageHead: () => null,
}));

vi.mock("@/pwa/components/InstallAppButton", () => ({
  InstallAppButton: () => null,
}));

describe("UserLoginPage Google OAuth", () => {
  beforeEach(() => {
    startSocialLoginMock.mockReset();
    window.sessionStorage.clear();
  });

  it("usa o fluxo social via helper e passa tenant/redirect corretos", async () => {
    startSocialLoginMock.mockRejectedValueOnce(new Error("oauth unavailable"));

    render(
      <MemoryRouter
        initialEntries={["/t/acme/pwa/login"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/t/:tenantSlug/pwa/login" element={<UserLoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Entrar com Google/i }));

    await waitFor(() => {
      expect(startSocialLoginMock).toHaveBeenCalledWith("google", {
        redirectTo: "/t/acme/pwa/app",
        tenantSlug: "acme",
      });
    });
  });
});
