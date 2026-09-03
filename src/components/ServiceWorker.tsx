"use client";

import { useEffect } from "react";

export default function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // In dev the worker caches _next/static chunks that change on every compile,
    // which puts the page into a reload loop. Only run it in production builds,
    // and clean up any worker left over from an earlier dev session.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
      if ("caches" in window) caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
      return;
    }

    const register = () => navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
