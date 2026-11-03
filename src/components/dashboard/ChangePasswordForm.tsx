"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/components/ui/turnstile-widget";
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from "@/lib/validations/auth";

import { changePasswordAction } from "@/app/(dashboard)/dashboard/settings/actions";

export default function ChangePasswordForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onBlur",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: ChangePasswordValues) {
    setSubmitError(null);
    setSubmitSuccess(false);
    const result = await changePasswordAction(values, captchaToken ?? "");
    if (result.success) {
      setSubmitSuccess(true);
      form.reset();
      turnstileRef.current?.reset();
    } else {
      setSubmitError(result.error);
      turnstileRef.current?.reset();
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          void form.handleSubmit(onSubmit)(event);
        }}
        className="space-y-5"
      >
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="At least 16 characters"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <TurnstileWidget ref={turnstileRef} onToken={setCaptchaToken} />

        {submitError && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {submitError}
          </p>
        )}

        {submitSuccess && (
          <p className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 p-3 text-sm text-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
            Password updated successfully.
          </p>
        )}

        <Button type="submit" disabled={isSubmitting || !captchaToken}>
          {isSubmitting ? "Updating..." : "Update password"}
        </Button>
      </form>
    </Form>
  );
}
