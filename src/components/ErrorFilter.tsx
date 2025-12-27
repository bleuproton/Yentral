"use client";

import { useEffect } from "react";

export function ErrorFilter() {
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      const msg = event?.error?.message || event?.message || "";
      const filename = event?.filename || "";
      if (msg.includes("Cannot redefine property: ethereum") || filename.startsWith("chrome-extension")) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    const rejHandler = (event: PromiseRejectionEvent) => {
      const msg = (event?.reason?.message as string) || "";
      if (msg.includes("Cannot redefine property: ethereum")) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener("error", handler, true);
    window.addEventListener("unhandledrejection", rejHandler, true);
    return () => {
      window.removeEventListener("error", handler, true);
      window.removeEventListener("unhandledrejection", rejHandler, true);
    };
  }, []);

  return null;
}
