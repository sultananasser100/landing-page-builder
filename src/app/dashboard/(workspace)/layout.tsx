import { DashboardHeader } from "@/features/dashboard/dashboard-header";

// The dashboard shell. Renders nothing sensitive; each page calls
// requireAdmin() itself (layouts are not re-run on every navigation).
export default function WorkspaceLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
