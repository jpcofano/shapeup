export type HomeLayout = "aurora" | "stadium" | "clasico";

const LS_KEY = "su-home-by-member";

export function getHomeLayout(memberId: string): HomeLayout {
  try {
    const map = JSON.parse(localStorage.getItem(LS_KEY) ?? "{}") as Record<string, string>;
    const l = map[memberId];
    if (l === "aurora" || l === "stadium" || l === "clasico") return l;
  } catch { /* */ }
  return "aurora";
}

export function setHomeLayout(memberId: string, layout: HomeLayout): void {
  try {
    const map = JSON.parse(localStorage.getItem(LS_KEY) ?? "{}") as Record<string, string>;
    map[memberId] = layout;
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch { /* */ }
}
