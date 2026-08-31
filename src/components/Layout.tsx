import { Outlet } from "react-router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * Landing layout — pattern B (nested routes).
 * Navbar is `fixed` (overlay nav per landing.md §0), so this layout owns the
 * 64px top offset on the content slot. Full-bleed heroes opt out inside the
 * page with `-mt-16`.
 */
export function Layout() {
  return (
    <div className="min-h-[100dvh] bg-abyss text-text-primary">
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
