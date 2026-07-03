"use client";

import { useActionState, useState } from "react";
import { signup, login, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AuthModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [registerState, registerAction, registerPending] = useActionState<AuthState, FormData>(signup, undefined);
  const [loginState, loginAction, loginPending] = useActionState<AuthState, FormData>(login, undefined);

  const toggleMode = () => setMode((m) => (m === "register" ? "login" : "register"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === "register" ? "Create account" : "Welcome back"}</DialogTitle>
          <DialogDescription>
            {mode === "register" ? "Track your media across categories" : "Sign in to your account"}
          </DialogDescription>
        </DialogHeader>

        {mode === "register" ? (
          <form action={registerAction} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <Input id="name" name="name" placeholder="Your name" required />
              {registerState?.errors?.name?.map((e) => <p key={e} className="text-xs text-destructive">{e}</p>)}
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
              {registerState?.errors?.email?.map((e) => <p key={e} className="text-xs text-destructive">{e}</p>)}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input id="password" name="password" type="password" placeholder="At least 6 characters" required />
              {registerState?.errors?.password?.map((e) => <p key={e} className="text-xs text-destructive">{e}</p>)}
            </div>
            {registerState?.message && <p className="text-sm text-destructive">{registerState.message}</p>}
            <Button type="submit" disabled={registerPending} className="w-full">
              {registerPending ? "Creating account..." : "Create account"}
            </Button>
          </form>
        ) : (
          <form action={loginAction} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
              {loginState?.errors?.email?.map((e) => <p key={e} className="text-xs text-destructive">{e}</p>)}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
              {loginState?.errors?.password?.map((e) => <p key={e} className="text-xs text-destructive">{e}</p>)}
            </div>
            {loginState?.message && <p className="text-sm text-destructive">{loginState.message}</p>}
            <Button type="submit" disabled={loginPending} className="w-full">
              {loginPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {mode === "register" ? (
            <>Already have an account?{" "}<button type="button" onClick={toggleMode} className="text-primary hover:underline font-medium cursor-pointer">Sign in</button></>
          ) : (
            <>Don&apos;t have an account?{" "}<button type="button" onClick={toggleMode} className="text-primary hover:underline font-medium cursor-pointer">Sign up</button></>
          )}
        </p>
      </DialogContent>
    </Dialog>
  );
}
