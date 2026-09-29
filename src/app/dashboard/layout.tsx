import type { Metadata } from "next";

// Shared by every /dashboard/* route, including ones outside the (workspace)
// shell (e.g. the Phase 5 editor). Auth is checked in pages and data access,
// not here.
export const metadata: Metadata = {
  title: { template: "%s · Dashboard", default: "Dashboard" },
  robots: { index: false, follow: false },
};

export default function DashboardRootLayout({ children }: LayoutProps<"/dashboard">) {
  return children;
}
