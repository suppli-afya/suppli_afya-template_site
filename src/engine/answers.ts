import type { Answers, GoalId } from "./types";

/** Small helpers for reading answers without type noise. */

export function one(a: Answers, id: string): string | null {
  const v = a[id];
  return typeof v === "string" && v.length > 0 ? v : null;
}

export function list(a: Answers, id: string): string[] {
  const v = a[id];
  return Array.isArray(v) ? v : [];
}

export function num(a: Answers, id: string): number | null {
  const v = a[id];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

export function has(a: Answers, id: string, value: string) {
  const v = a[id];
  return Array.isArray(v) ? v.includes(value) : v === value;
}

export function hasAny(a: Answers, id: string, values: string[]) {
  return values.some((v) => has(a, id, v));
}

export function goalChosen(a: Answers, goal: GoalId) {
  return list(a, "goals").includes(goal);
}

export function firstName(a: Answers) {
  const n = one(a, "first_name");
  if (!n) return "";
  const t = n.trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}
