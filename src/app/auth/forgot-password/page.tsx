"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPassword, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(forgotPassword, undefined);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-gradient-to-b from-background via-background to-muted/30 px-4">
      <Card className="w-full max-w-sm animate-scale-in border-border/50 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Forgot password?</CardTitle>
          <CardDescription>Enter your email and we&apos;ll send you a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
              {state?.errors?.email?.map((e) => (
                <p key={e} className="text-xs text-destructive">{e}</p>
              ))}
            </div>
            {state?.message && (
              <p className="text-sm text-muted-foreground">{state.message}</p>
            )}
            <Button type="submit" disabled={pending} className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
              {pending ? "Sending..." : "Send reset link"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Remember your password?{" "}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
