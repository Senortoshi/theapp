import React from "react";
import { avatarToSvgPath, getAvatarRotation } from "@/utils/geometry";

export const GeometricAvatar = React.memo(function GeometricAvatar({
  seed,
  address,
  size = 32,
}: {
  seed?: string;
  address?: string;
  size?: number;
}) {
  const resolvedSeed = seed ?? address ?? "";
  const path = React.useMemo(() => avatarToSvgPath(resolvedSeed, size), [resolvedSeed, size]);
  const rotation = React.useMemo(() => getAvatarRotation(resolvedSeed), [resolvedSeed]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="flex-shrink-0"
      aria-hidden
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path
        d={path}
        fill="var(--surface-2)"
        stroke="var(--green)"
        strokeWidth={1.2}
      />
    </svg>
  );
});
