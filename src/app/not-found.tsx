import Link from "next/link";
import { Home, LayoutDashboard } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="space-y-6 text-center animate-scale-in">
        <p className="bg-gradient-to-r from-primary to-primary/40 bg-clip-text font-heading text-7xl font-bold text-transparent sm:text-9xl">
          404
        </p>
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold">This page went missing</h1>
          <p className="text-sm text-muted-foreground">
            The title or page you&apos;re looking for isn&apos;t here.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className={cn(buttonVariants({ size: "lg" }))}>
            <Home />
            Back home
          </Link>
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            <LayoutDashboard />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
