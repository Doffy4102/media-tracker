"use client";

import { Toast } from "@base-ui/react/toast";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

const toastManager = Toast.createToastManager();

export const toast = {
  success: (title: string, description?: string) =>
    toastManager.add({ title, description, type: "success" }),
  error: (title: string, description?: string) =>
    toastManager.add({ title, description, type: "error" }),
};

function ToastList() {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Portal>
      <Toast.Viewport className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <Toast.Root
            key={t.id}
            toast={t}
            className={cn(
              "pointer-events-auto overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg",
              "transition-all duration-200 data-[starting-style]:opacity-0 data-[starting-style]:translate-y-3 data-[ending-style]:opacity-0 data-[ending-style]:translate-y-3",
              "z-[calc(1000_-_var(--toast-index))]",
              t.type === "success" && "border-l-4 border-l-emerald-500",
              t.type === "error" && "border-l-4 border-l-destructive",
            )}
          >
            <Toast.Content className="flex items-start gap-3 p-4">
              {t.type === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              )}
              <div className="min-w-0 flex-1">
                <Toast.Title className="text-sm font-medium">{t.title}</Toast.Title>
                {t.description && (
                  <Toast.Description className="mt-0.5 text-xs text-muted-foreground">
                    {t.description}
                  </Toast.Description>
                )}
              </div>
              <Toast.Close
                aria-label="Dismiss"
                className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </Toast.Close>
            </Toast.Content>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

export function Toaster() {
  return (
    <Toast.Provider toastManager={toastManager} timeout={4500} limit={3}>
      <ToastList />
    </Toast.Provider>
  );
}
