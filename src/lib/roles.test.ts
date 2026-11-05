import { describe, expect, it } from "vitest";
import { calcAge, canAccessSystem } from "./roles";

describe("acesso ao sistema", () => {
  it("usuário recém-cadastrado (pendente, sem função) não acessa", () => {
    expect(canAccessSystem("pendente", [])).toBe(false);
  });
  it("usuário ativo sem função não acessa", () => {
    expect(canAccessSystem("ativo", [])).toBe(false);
  });
  it("usuário suspenso não acessa mesmo com função", () => {
    expect(canAccessSystem("suspenso", ["psicologo"])).toBe(false);
  });
  it("usuário ativo com função acessa", () => {
    expect(canAccessSystem("ativo", ["recepcao"])).toBe(true);
  });
});

describe("idade calculada", () => {
  it("antes do aniversário no ano", () => {
    expect(calcAge("2000-12-10", new Date(2026, 10, 5))).toBe(25);
  });
  it("no dia do aniversário", () => {
    expect(calcAge("2000-11-05", new Date(2026, 10, 5))).toBe(26);
  });
});
