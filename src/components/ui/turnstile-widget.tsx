"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useImperativeHandle, useRef, type Ref } from "react";

export type TurnstileWidgetHandle = {
  reset: () => void;
};

type TurnstileWidgetProps = {
  ref?: Ref<TurnstileWidgetHandle>;
  onToken: (token: string | null) => void;
};

/**
 * Cloudflare Turnstile widget. The token is single-use and expires after
 * a few minutes: call `reset()` after a failed submit so the visitor can
 * try again. Submit buttons should stay disabled until `onToken` receives
 * a non-null token.
 */
export function TurnstileWidget({ ref, onToken }: TurnstileWidgetProps) {
  const instanceRef = useRef<TurnstileInstance | undefined>(undefined);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useImperativeHandle(
    ref,
    () => ({
      reset() {
        instanceRef.current?.reset();
        onToken(null);
      },
    }),
    [onToken],
  );

  if (!siteKey) {
    return null;
  }

  return (
    <Turnstile
      ref={instanceRef}
      siteKey={siteKey}
      options={{ theme: "dark", size: "flexible" }}
      onSuccess={onToken}
      onExpire={() => {
        onToken(null);
      }}
      onError={() => {
        onToken(null);
      }}
      onTimeout={() => {
        onToken(null);
      }}
    />
  );
}
