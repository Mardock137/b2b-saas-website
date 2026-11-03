"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuroraBackground } from "@/components/layout/AuroraBackground";
import { AuthCard } from "@/components/ui/auth-card";
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
  MotionItem,
  MotionStagger,
} from "@/components/ui/spotlight-card";
import {
  AUTH_CALLBACK_ERROR_MESSAGES,
  isAuthCallbackErrorCode,
} from "@/lib/auth/callback-errors";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";

import { loginAction } from "./actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? undefined;
  const callbackErrorParam = searchParams.get("error");
  const callbackErrorMessage = isAuthCallbackErrorCode(callbackErrorParam)
    ? AUTH_CALLBACK_ERROR_MESSAGES[callbackErrorParam]
    : null;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;
  const showCallbackError =
    callbackErrorMessage !== null &&
    submitError === null &&
    !form.formState.isSubmitted;

  async function onSubmit(values: LoginValues) {
    setSubmitError(null);
    const result = await loginAction(values, captchaToken ?? "", next);
    if (result && !result.success) {
      setSubmitError(result.error);
      turnstileRef.current?.reset();
    }
  }

  return (
    <div className="relative overflow-hidden">
      <AuroraBackground intensity="subtle" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center px-4 py-12 sm:px-6">
        <MotionStagger className="w-full">
          <MotionItem>
            <div className="text-center">
              <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Log in to manage your apps.
              </p>
            </div>
          </MotionItem>

          <MotionItem className="mt-10">
            <AuthCard>
              <Form {...form}>
                <form
                  onSubmit={(event) => {
                    void form.handleSubmit(onSubmit)(event);
                  }}
                  className="space-y-5"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@company.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Your password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <TurnstileWidget ref={turnstileRef} onToken={setCaptchaToken} />

                  {(submitError || showCallbackError) && (
                    <p
                      role="alert"
                      className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                    >
                      {submitError ?? callbackErrorMessage}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting || !captchaToken}
                  >
                    {isSubmitting ? "Logging in..." : "Log in"}
                  </Button>
                </form>
              </Form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="font-medium text-primary hover:opacity-90"
                >
                  Sign up
                </Link>
              </p>
            </AuthCard>
          </MotionItem>
        </MotionStagger>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
