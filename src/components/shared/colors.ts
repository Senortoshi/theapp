const colorMap = new Map<string, string>();
const GOLDEN_ANGLE = 137.5;

export function getStableColor(id: string): string {
  if (!colorMap.has(id)) {
    const hue = (colorMap.size * GOLDEN_ANGLE) % 360;
    colorMap.set(id, `hsl(${hue}, 70%, 55%)`);
  }
  return colorMap.get(id)!;
}

export function getStableColorHex(id: string): string {
  const hsl = getStableColor(id);
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return "#00e87a";
  const h = Number(match[1]) / 360;
  const s = Number(match[2]) / 100;
  const l = Number(match[3]) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  const r = Math.round(f(0) * 255);
  const g = Math.round(f(8) * 255);
  const b = Math.round(f(4) * 255);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
