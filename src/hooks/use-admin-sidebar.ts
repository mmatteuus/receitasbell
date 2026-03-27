import { createContext, useContext } from "react";

export interface SidebarCtx {
  collapsed: boolean;
  toggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  dark: boolean;
  toggleDark: () => void;
}

const defaultContext: SidebarCtx = {
  collapsed: false,
  toggle: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
  dark: false,
  toggleDark: () => {},
};

export const SidebarContext = createContext<SidebarCtx>(defaultContext);

export const useAdminSidebar = () => useContext(SidebarContext);
