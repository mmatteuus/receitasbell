// @vitest-environment jsdom

import { axe } from "jest-axe";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import PublicLayout from "@/components/layout/PublicLayout";

vi.mock("@/components/layout/Header", () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock("@/components/layout/Footer", () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

vi.mock("@/components/BackToTop", () => ({
  BackToTop: () => <button type="button">Voltar ao topo</button>,
}));

describe("PublicLayout", () => {
  it("renders a skip link and main landmark with no obvious accessibility violations", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<div>Conteúdo principal</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const skipLink = screen.getByRole("link", { name: "Pular para conteúdo principal" });
    expect(skipLink).toHaveAttribute("href", "#main-content");
    expect(container.querySelector("main#main-content")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
