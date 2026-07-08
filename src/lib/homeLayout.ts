export type HomeLayout = "aurora" | "stadium" | "clasico" | "pulse" | "premium";

const LAYOUTS: readonly HomeLayout[] = ["aurora", "stadium", "clasico", "pulse", "premium"];

const LS_KEY = "su-home-by-member";

export function getHomeLayout(memberId: string): HomeLayout {
  try {
    const map = JSON.parse(localStorage.getItem(LS_KEY) ?? "{}") as Record<string, string>;
    const l = map[memberId];
    if ((LAYOUTS as string[]).includes(l)) return l as HomeLayout;
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
