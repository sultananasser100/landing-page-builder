import { Button } from "@/components/ui/button";

import { logout } from "./actions";

/** A plain form posting to the logout Server Action; needs no client JS. */
export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="outline">
        Sign out
      </Button>
    </form>
  );
}
