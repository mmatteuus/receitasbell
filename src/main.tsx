import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { initSeedData } from "@/lib/seed-data";
import "./index.css";

// Populate localStorage with sample recipes if empty
initSeedData();

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
