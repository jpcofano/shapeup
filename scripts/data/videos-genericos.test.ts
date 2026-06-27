import { describe, it, expect } from "vitest";
import { PATRONES_MOVIMIENTO } from "../../src/types/models";
import { videoGenericoPorPatron, urlClip } from "./videos-genericos";

describe("videoGenericoPorPatron — mapeo patrón → clip representativo (B2)", () => {
  it("asigna un clip a los patrones con cobertura", () => {
    expect(videoGenericoPorPatron("Dominante de rodilla")?.archivo).toContain("Squat");
    expect(videoGenericoPorPatron("Dominante de cadera")?.archivo).toContain("Deadlift");
    expect(videoGenericoPorPatron("Tracción vertical")?.archivo).toContain("Pull-ups");
  });

  it("deja sin clip los patrones sin cobertura (caen al placeholder 'Video pronto')", () => {
    expect(videoGenericoPorPatron("Core anti-extensión")).toBeUndefined();
    expect(videoGenericoPorPatron("Core anti-rotación")).toBeUndefined();
  });

  it("urlClip genera una URL hotlinkeable vía Special:FilePath, sin espacios", () => {
    const clip = videoGenericoPorPatron("Dominante de rodilla")!;
    const url = urlClip(clip);
    expect(url).toBe("https://commons.wikimedia.org/wiki/Special:FilePath/Squat_-_exercise_demonstration_video.webm");
    expect(url).not.toMatch(/ /);
  });

  it("todo patrón del modelo, mapeado o no, resuelve sin tirar", () => {
    for (const p of PATRONES_MOVIMIENTO) {
      expect(() => videoGenericoPorPatron(p)).not.toThrow();
    }
  });
});
