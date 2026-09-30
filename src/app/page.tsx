import { redirect } from "next/navigation";

// The dashboard is the app's entry point. Signed-out visitors are sent on to
// /login by the proxy (and requireAdmin), then back to the dashboard.
export default function Home() {
  redirect("/dashboard");
}
