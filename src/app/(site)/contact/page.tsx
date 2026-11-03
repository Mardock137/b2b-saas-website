"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
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
  MotionItem,
  MotionStagger,
} from "@/components/ui/spotlight-card";
import { Textarea } from "@/components/ui/textarea";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/components/ui/turnstile-widget";
import { contactSchema, type ContactValues } from "@/lib/validations/contact";

import { sendContactMessageAction } from "./actions";

export default function ContactPage() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      companyName: "",
      email: "",
      message: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: ContactValues) {
    setSubmitError(null);
    const result = await sendContactMessageAction(
      values,
      captchaToken ?? "",
      honeypot,
    );
    if (result.success) {
      setSubmitted(true);
      form.reset();
    } else {
      setSubmitError(result.error);
      turnstileRef.current?.reset();
    }
  }

  return (
    <div className="relative overflow-hidden">
      <AuroraBackground intensity="subtle" />
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
        <MotionStagger className="w-full">
          {submitted ? (
            <MotionItem>
              <AuthCard className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                  Message sent!
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Thanks for reaching out. We&apos;ll get back to you shortly.
                </p>
              </AuthCard>
            </MotionItem>
          ) : (
            <>
              <MotionItem>
                <div className="text-center">
                  <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                    Let&apos;s talk
                  </h1>
                  <p className="mt-4 text-base text-muted-foreground">
                    Have a question? Send us a message and we&apos;ll get
                    back to you shortly.
                  </p>
                </div>
              </MotionItem>

              <MotionItem className="mt-12">
                <AuthCard>
                  <Form {...form}>
                    <form
                      onSubmit={(event) => {
                        void form.handleSubmit(onSubmit)(event);
                      }}
                      className="relative space-y-6"
                    >
                      <div
                        aria-hidden="true"
                        className="absolute -left-[9999px] h-px w-px overflow-hidden"
                      >
                        <label htmlFor="contact-website">Website</label>
                        <input
                          id="contact-website"
                          name="website"
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                          value={honeypot}
                          onChange={(event) => setHoneypot(event.target.value)}
                        />
                      </div>

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
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea
                                rows={6}
                                placeholder="Tell us about your needs..."
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
                        <Send className="h-4 w-4" />
                        {isSubmitting ? "Sending..." : "Send message"}
                      </Button>
                    </form>
                  </Form>
                </AuthCard>
              </MotionItem>
            </>
          )}
        </MotionStagger>
      </div>
    </div>
  );
}
