"use client";

import { useEffect, useRef } from "react";

export default function Meter({
  value,
  max,
  colour = "var(--cyan)",
  slim = false,
}: {
  value: number;
  max: number;
  colour?: string;
  slim?: boolean;
}) {
  const bar = useRef<HTMLElement>(null);
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));

  useEffect(() => {
    if (bar.current) bar.current.style.width = `${pct}%`;
  }, [pct]);

  return (
    <div className={slim ? "meter meter--slim" : "meter"} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <i ref={bar} style={{ ["--fill" as string]: colour }} />
    </div>
  );
}
