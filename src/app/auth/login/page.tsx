"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GoogleButton, OrDivider } from "@/components/GoogleButton";

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_denied: "Google sign-in was cancelled.",
  google_invalid_state: "That sign-in attempt expired. Please try again.",
  google_email_unverified: "Your Google account's email is not verified. Verify it at accounts.google.com and try again.",
  google_unconfigured: "Google sign-in is not configured on the server.",
  google_failed: "Could not complete Google sign-in. Please try again.",
  rate_limited: "Too many attempts. Please wait a moment and try again.",
  default: "Could not complete Google sign-in. Please try again.",
};

function GoogleErrorBanner() {
  const error = useSearchParams().get("error");
  if (!error) return null;
  const message = GOOGLE_ERROR_MESSAGES[error] ?? GOOGLE_ERROR_MESSAGES.default;
  return <p className="text-sm text-destructive text-center">{message}</p>;
}

export default function LoginPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, undefined);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-gradient-to-b from-background via-background to-muted/30 px-4">
      <Card className="w-full max-w-sm animate-scale-in border-border/50 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
              {state?.errors?.email?.map((e) => (<p key={e} className="text-xs text-destructive">{e}</p>))}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
              {state?.errors?.password?.map((e) => (<p key={e} className="text-xs text-destructive">{e}</p>))}
              <div className="text-right">
                <Link href="/auth/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>
            {state?.message && <p className="text-sm text-destructive">{state.message}</p>}
            <Button type="submit" disabled={pending} className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
              {pending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <Suspense fallback={null}>
            <GoogleErrorBanner />
          </Suspense>
          <OrDivider className="my-4" />
          <GoogleButton />
          <p className="text-center text-sm text-muted-foreground mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-primary hover:underline font-medium">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
