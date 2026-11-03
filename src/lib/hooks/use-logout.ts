"use client";

import { useTransition } from "react";

import { logoutAction } from "@/app/(site)/auth/actions";

export function useLogout() {
  const [isPending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  return { logout, isPending };
}
