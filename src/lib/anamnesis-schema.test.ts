import { describe, expect, it } from "vitest";
import { hasImmediateRisk } from "./anamnesis-schema";

describe("alerta de segurança", () => {
  it("ideação suicida atual gera alerta imediato", () => {
    expect(hasImmediateRisk({ risk_suicidal_ideation: "Atual" })).toBe(true);
  });
  it("situação recente gera alerta", () => {
    expect(hasImmediateRisk({ risk_self_harm: "Recente" })).toBe(true);
  });
  it("histórico apenas passado não gera alerta imediato", () => {
    expect(hasImmediateRisk({ risk_suicide_attempt: "Passado (histórico)" })).toBe(false);
  });
});
