import { describe, it, expect } from "vitest";
import { resolverPatron } from "./patronMovimiento";

describe("resolverPatron — mapeo de keywords", () => {
  // Dominante de rodilla
  it("Back Squat → Dominante de rodilla",
    () => expect(resolverPatron("Back Squat", "strength", "compound", "push")).toBe("Dominante de rodilla"));
  it("Barbell Lunge → Dominante de rodilla",
    () => expect(resolverPatron("Barbell Lunge", "strength", "compound", "push")).toBe("Dominante de rodilla"));

  // Dominante de cadera
  it("Barbell Deadlift → Dominante de cadera",
    () => expect(resolverPatron("Barbell Deadlift", "strength", "compound", "pull")).toBe("Dominante de cadera"));
  it("Romanian Deadlift → Dominante de cadera",
    () => expect(resolverPatron("Romanian Deadlift (RDL)", "strength", "compound", "pull")).toBe("Dominante de cadera"));
  it("Barbell Hip Thrust → Dominante de cadera",
    () => expect(resolverPatron("Barbell Hip Thrust", "strength", "compound", "push")).toBe("Dominante de cadera"));

  // Empuje vertical
  it("Barbell Military Press → Empuje vertical",
    () => expect(resolverPatron("Barbell Military Press", "strength", "compound", "push")).toBe("Empuje vertical"));
  it("Dumbbell Overhead Press → Empuje vertical",
    () => expect(resolverPatron("Dumbbell Overhead Press", "strength", "compound", "push")).toBe("Empuje vertical"));

  // Tracción vertical
  it("Chin-Up → Tracción vertical (no horizontal)",
    () => expect(resolverPatron("Chin-Up", "strength", "compound", "pull")).toBe("Tracción vertical"));
  it("Pulldown → Tracción vertical",
    () => expect(resolverPatron("Cable Lat Pulldown", "strength", "compound", "pull")).toBe("Tracción vertical"));

  // Tracción horizontal
  it("Barbell Row → Tracción horizontal",
    () => expect(resolverPatron("Barbell Row", "strength", "compound", "pull")).toBe("Tracción horizontal"));
  it("Face Pull → Tracción horizontal",
    () => expect(resolverPatron("Cable Face Pull", "strength", "compound", "pull")).toBe("Tracción horizontal"));

  // Empuje horizontal
  it("Bench Press → Empuje horizontal",
    () => expect(resolverPatron("Barbell Bench Press", "strength", "compound", "push")).toBe("Empuje horizontal"));
  it("Push-Up → Empuje horizontal",
    () => expect(resolverPatron("Push-Up", "strength", "compound", "push")).toBe("Empuje horizontal"));

  // Core
  it("Plank → Core anti-extensión",
    () => expect(resolverPatron("Plank", "strength", "compound", null)).toBe("Core anti-extensión"));
  it("Crunch → Core flexión",
    () => expect(resolverPatron("Crunch", "strength", "isolation", null)).toBe("Core flexión"));
  it("Pallof Press → Core anti-extensión",
    () => expect(resolverPatron("Pallof Press", "strength", "compound", "push")).toBe("Core anti-extensión"));
  it("Russian Twist → Core anti-rotación",
    () => expect(resolverPatron("Russian Twist", "strength", "compound", null)).toBe("Core anti-rotación"));

  // Cardio
  it("categoría cardio → Locomoción / cardio",
    () => expect(resolverPatron("Running", "cardio", null, null)).toBe("Locomoción / cardio"));

  // Isolation fallback
  it("Bicep Curl (isolation) → Aislamiento",
    () => expect(resolverPatron("Bicep Curl", "strength", "isolation", "pull")).toBe("Aislamiento"));

  // Carry
  it("Farmer Carry → Locomoción / cardio",
    () => expect(resolverPatron("Farmer Carry", "strength", "compound", null)).toBe("Locomoción / cardio"));
});
