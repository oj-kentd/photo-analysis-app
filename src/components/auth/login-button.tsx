"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

/**
 * LoginButton component that displays login/logout functionality
 * based on the user's authentication status
 */
export function LoginButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p>Signed in as {session.user?.email}</p>
        <Button variant="outline" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => signIn("google")}>
      Sign in with Google
    </Button>
  );
}
