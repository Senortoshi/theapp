/**
 * Deterministic geometric avatar from id seed — same id always same shape.
 */
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = str.charCodeAt(i) + ((h << 5) - h);
  }
  return Math.abs(h);
}

export function getAvatarShape(seed: string): "square" | "diamond" | "circle" | "triangle" {
  const h = hash(seed);
  const shapes: Array<"square" | "diamond" | "circle" | "triangle"> = ["square", "diamond", "circle", "triangle"];
  return shapes[h % 4];
}

export function getAvatarHue(seed: string): number {
  return hash(seed) % 360;
}

/** Rotation in degrees (0, 90, 180, 270) from hash for deterministic variation. */
export function getAvatarRotation(seed: string): number {
  return (hash(seed + "r") % 4) * 90;
}

export function avatarToSvgPath(seed: string, size: number): string {
  const shape = getAvatarShape(seed);
  const s = size / 2;
  if (shape === "square") {
    return `M 0 0 L ${size} 0 L ${size} ${size} L 0 ${size} Z`;
  }
  if (shape === "diamond") {
    return `M ${s} 0 L ${size} ${s} L ${s} ${size} L 0 ${s} Z`;
  }
  if (shape === "triangle") {
    return `M ${s} 0 L ${size} ${size} L 0 ${size} Z`;
  }
  const r = s;
  return `M ${s} ${s} m -${r} 0 a ${r} ${r} 0 1 1 ${2 * r} 0 a ${r} ${r} 0 1 1 -${2 * r} 0`;
}

export function getAvatarFill(seed: string): string {
  const hue = getAvatarHue(seed);
  return `hsl(${hue}, 65%, 45%)`;
}
