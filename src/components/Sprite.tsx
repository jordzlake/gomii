"use client";

import { useEffect, useRef, useState } from "react";
import { avatarFrame, effectFrame, EffectName, IconName, iconSrc } from "@/data/sprites";

export function Icon({ name, size = 24, alt = "" }: { name: IconName; size?: number; alt?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={iconSrc(name)} width={size} height={size} alt={alt} aria-hidden={alt === ""} />;
}

/**
 * Plays one row of a character tile map. Frame 0 is the resting pose; the row
 * cycles only while `playing` is true, so the screen stays calm by default.
 */
export function CharacterSprite({
  avatarId,
  playing = false,
  fps = 6,
  className = "",
  size = 132,
}: {
  avatarId: string;
  playing?: boolean;
  fps?: number;
  className?: string;
  size?: number;
}) {
  const [frame, setFrame] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!playing) {
      setFrame(0);
      return;
    }
    timer.current = setInterval(() => setFrame((f) => (f + 1) % 5), 1000 / fps);
    return () => clearInterval(timer.current);
  }, [playing, fps]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarFrame(avatarId, frame)}
      width={size}
      height={size}
      alt=""
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}

/** Five stage effect strip: pass a 0–4 stage, or animate it once. */
export function EffectSprite({
  name,
  stage = 0,
  size = 48,
  animate = false,
}: {
  name: EffectName;
  stage?: number;
  size?: number;
  animate?: boolean;
}) {
  const [f, setF] = useState(animate ? 0 : stage);

  useEffect(() => {
    if (!animate) {
      setF(stage);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setF(Math.min(i, 4));
      if (i >= 4) clearInterval(id);
    }, 130);
    return () => clearInterval(id);
  }, [animate, stage]);

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={effectFrame(name, f)} width={size} height={size} alt="" style={{ objectFit: "contain" }} />;
}
