import React from "react";
import { avatarToSvgPath, getAvatarRotation } from "../shared/geometry";

export const GeometricAvatar = React.memo(function GeometricAvatar({
  seed,
  size = 32,
}: {
  seed: string;
  size?: number;
}) {
  const path = React.useMemo(() => avatarToSvgPath(seed, size), [seed, size]);
  const rotation = React.useMemo(() => getAvatarRotation(seed), [seed]);

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
