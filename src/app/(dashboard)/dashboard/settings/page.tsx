import type { Metadata } from "next";

import ChangePasswordForm from "@/components/dashboard/ChangePasswordForm";
import { AuthCard } from "@/components/ui/auth-card";

export const metadata: Metadata = {
  title: "Settings — Acme Labs",
  description: "Manage your account settings.",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Manage your account settings.
        </p>
      </header>

      <section className="mt-12">
        <AuthCard className="max-w-md">
          <h2 className="text-xl font-semibold text-foreground">
            Change password
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Update the password used to sign in to your account.
          </p>
          <div className="mt-6">
            <ChangePasswordForm />
          </div>
        </AuthCard>
      </section>
    </div>
  );
}
