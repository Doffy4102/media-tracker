"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { resetPassword, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const [state, action, pending] = useActionState<AuthState, FormData>(resetPassword, undefined);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-gradient-to-b from-background via-background to-muted/30 px-4">
      <Card className="w-full max-w-sm animate-scale-in border-border/50 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Set new password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <input type="hidden" name="token" value={params.token ?? ""} />
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">New password</label>
              <Input id="password" name="password" type="password" placeholder="At least 6 characters" required />
              {state?.errors?.password?.map((e) => (
                <p key={e} className="text-xs text-destructive">{e}</p>
              ))}
            </div>
            {state?.message && (
              <p className="text-sm text-destructive">{state.message}</p>
            )}
            <Button type="submit" disabled={pending} className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
              {pending ? "Resetting..." : "Reset password"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            <Link href="/auth/login" className="text-primary hover:underline font-medium">Back to sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
