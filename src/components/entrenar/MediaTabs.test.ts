import { describe, it, expect } from "vitest";
import { demoMode } from "./MediaTabs";

const URL = "https://example.com/clip.mp4";
const YT  = "dQw4w9WgXcQ";

describe("demoMode", () => {
  it("youtube tiene máxima prioridad sobre imágenes", () => {
    expect(demoMode(["a.jpg", "b.jpg"], YT, undefined, undefined, false)).toBe("youtube");
    expect(demoMode(["a.jpg", "b.jpg"], YT, undefined, undefined, true)).toBe("youtube");
  });

  it("youtube tiene máxima prioridad sobre video genérico", () => {
    expect(demoMode([], YT, URL, true, false)).toBe("youtube");
  });

  it("youtube sin imágenes ni reducedMotion", () => {
    expect(demoMode([], YT, undefined, undefined, false)).toBe("youtube");
    expect(demoMode([], YT, undefined, undefined, true)).toBe("youtube");
  });

  it("anima cuando hay 2+ imágenes y sin reducedMotion", () => {
    expect(demoMode(["a.jpg", "b.jpg"], undefined, undefined, undefined, false)).toBe("images-animated");
  });

  it("estático cuando hay 2+ imágenes pero reducedMotion activo", () => {
    expect(demoMode(["a.jpg", "b.jpg"], undefined, undefined, undefined, true)).toBe("images-static");
  });

  it("estático con 1 imagen sin importar reducedMotion", () => {
    expect(demoMode(["a.jpg"], undefined, undefined, undefined, false)).toBe("images-static");
    expect(demoMode(["a.jpg"], undefined, undefined, undefined, true)).toBe("images-static");
  });

  it("las imágenes tienen prioridad sobre el video genérico", () => {
    expect(demoMode(["a.jpg", "b.jpg"], undefined, URL, true, false)).toBe("images-animated");
    expect(demoMode(["a.jpg"], undefined, URL, true, false)).toBe("images-static");
  });

  it("video cuando no hay imágenes y el video no es genérico", () => {
    expect(demoMode([], undefined, URL, false, false)).toBe("video");
    expect(demoMode([], undefined, URL, undefined, false)).toBe("video");
  });

  it("empty cuando no hay imágenes y el video es genérico", () => {
    expect(demoMode([], undefined, URL, true, false)).toBe("empty");
  });

  it("empty cuando no hay imágenes ni video ni youtube", () => {
    expect(demoMode([], undefined, undefined, undefined, false)).toBe("empty");
    expect(demoMode([], undefined, undefined, undefined, true)).toBe("empty");
  });
});
