"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";

import { AuroraBackground } from "@/components/layout/AuroraBackground";
import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/components/ui/turnstile-widget";
import {
  MotionItem,
  MotionStagger,
} from "@/components/ui/spotlight-card";
import { listTaxIdCountries } from "@/lib/tax-id/countries";
import { signupSchema, type SignupValues } from "@/lib/validations/auth";

import { signupAction } from "./actions";

const COUNTRY_OPTIONS = listTaxIdCountries();

export default function SignUpPage() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
    defaultValues: {
      companyName: "",
      email: "",
      taxIdCountry: "" as SignupValues["taxIdCountry"],
      taxId: "",
      password: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: SignupValues) {
    setSubmitError(null);
    const result = await signupAction(values, captchaToken ?? "");
    if (result.success) {
      setSubmittedEmail(values.email);
      form.reset();
    } else {
      setSubmitError(result.error);
      turnstileRef.current?.reset();
    }
  }

  return (
    <div className="relative overflow-hidden">
      <AuroraBackground intensity="subtle" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center px-4 py-12 sm:px-6">
        <MotionStagger className="w-full">
          {submittedEmail ? (
            <MotionItem>
              <AuthCard className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                  Check your inbox
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  We&apos;ve sent a confirmation link to{" "}
                  <span className="font-medium text-foreground">
                    {submittedEmail}
                  </span>
                  . Click the link to activate your account.
                </p>
                <p className="mt-6 text-xs text-muted-foreground">
                  Didn&apos;t receive anything? Check your spam folder, then{" "}
                  <Link
                    href="/contact"
                    className="font-medium text-primary hover:opacity-90"
                  >
                    contact support
                  </Link>
                  .
                </p>
              </AuthCard>
            </MotionItem>
          ) : (
            <>
              <MotionItem>
                <div className="text-center">
                  <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                    Create your account
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Start deploying apps in minutes.
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
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company name</FormLabel>
                            <FormControl>
                              <Input placeholder="Acme Inc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="you@company.com"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Use your company email. Personal addresses (Gmail,
                              Yahoo, Outlook, etc.) are not accepted.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="taxIdCountry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Select {...field}>
                                <option value="" disabled>
                                  Select a country
                                </option>
                                {COUNTRY_OPTIONS.map((country) => (
                                  <option key={country.code} value={country.code}>
                                    {country.name}
                                  </option>
                                ))}
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="taxId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax ID / VAT number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              Business tax ID only
                            </FormDescription>
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
                                placeholder="At least 16 characters"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <TurnstileWidget
                        ref={turnstileRef}
                        onToken={setCaptchaToken}
                      />

                      {submitError && (
                        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                          {submitError}
                        </p>
                      )}

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={isSubmitting || !captchaToken}
                      >
                        {isSubmitting ? "Creating account..." : "Create account"}
                      </Button>
                    </form>
                  </Form>

                  <p className="mt-8 text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      href="/auth/login"
                      className="font-medium text-primary hover:opacity-90"
                    >
                      Log in
                    </Link>
                  </p>
                </AuthCard>
              </MotionItem>
            </>
          )}
        </MotionStagger>
      </div>
    </div>
  );
}
