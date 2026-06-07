import { describe, it, expect } from "vitest";
import { parsearLiveData } from "./samsungLiveData";

const RAW_VALIDO = [
  { heart_rate: 120.0, start_time: 1000 },
  { heart_rate: 135.0, start_time: 2000 },
  { heart_rate: 110.0, start_time: 500 },  // fuera de orden → debe ordenarse
];

describe("parsearLiveData", () => {
  it("parsea y ordena por ms", () => {
    const pts = parsearLiveData(RAW_VALIDO);
    expect(pts).toHaveLength(3);
    expect(pts[0]).toEqual({ ms: 500, fc: 110 });
    expect(pts[1]).toEqual({ ms: 1000, fc: 120 });
    expect(pts[2]).toEqual({ ms: 2000, fc: 135 });
  });

  it("filtra muestras sin heart_rate válido", () => {
    const raw = [
      { heart_rate: 0,  start_time: 100 },  // 0 excluido
      { start_time: 200 },                   // sin heart_rate
      { heart_rate: "alto", start_time: 300 }, // no numérico
      { heart_rate: 90, start_time: 400 },   // válido
    ];
    const pts = parsearLiveData(raw);
    expect(pts).toHaveLength(1);
    expect(pts[0].fc).toBe(90);
  });

  it("devuelve [] para inputs no-array", () => {
    expect(parsearLiveData(null)).toEqual([]);
    expect(parsearLiveData({})).toEqual([]);
    expect(parsearLiveData("string")).toEqual([]);
  });

  it("devuelve [] para array vacío", () => {
    expect(parsearLiveData([])).toEqual([]);
  });
});
