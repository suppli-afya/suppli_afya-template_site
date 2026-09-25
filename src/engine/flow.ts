import { QUESTIONS, QUESTIONS_BY_ID } from "./questions";
import type { Answers, EngineContext, Question, QuestionOption } from "./types";

/**
 * Questions that apply given the answers so far, in display order.
 * Goal follow-ups are asked in the order the person ranked their goals.
 */
export function visibleQuestions(answers: Answers): Question[] {
  const shown = QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));
  const ranked = Array.isArray(answers.goals) ? answers.goals : [];
  const slots = shown.map((q, i) => (q.goal ? i : -1)).filter((i) => i >= 0);
  if (slots.length < 2) return shown;
  const followUps = slots
    .map((i) => shown[i])
    .map((q, order) => ({ q, order, rank: ranked.indexOf(q.goal!) }))
    .sort((a, b) => a.rank - b.rank || a.order - b.order)
    .map((x) => x.q);
  const out = [...shown];
  slots.forEach((slot, k) => (out[slot] = followUps[k]));
  return out;
}

export function visibleOptions(q: Question, answers: Answers): QuestionOption[] {
  return (q.options ?? []).filter((o) => !o.showIf || o.showIf(answers));
}

export function resolveText(
  value: Question["prompt"] | Question["helper"],
  answers: Answers,
  ctx: EngineContext,
): string {
  if (!value) return "";
  return typeof value === "function" ? value(answers, ctx) : value;
}

/** Whether the current answer lets the person move on. */
export function isAnswered(q: Question, answers: Answers): boolean {
  const v = answers[q.id];
  switch (q.kind) {
    case "section":
      return true;
    case "text": {
      const s = typeof v === "string" ? v.trim() : "";
      return s.length >= (q.range?.min ?? 1) && s.length <= (q.range?.max ?? 200);
    }
    case "number": {
      const n = typeof v === "number" ? v : Number(v);
      if (v === undefined || v === "" || !Number.isFinite(n)) return false;
      return n >= (q.range?.min ?? -Infinity) && n <= (q.range?.max ?? Infinity);
    }
    case "single":
    case "scale":
      return v !== undefined && v !== "";
    case "multi":
    case "ranked":
      return Array.isArray(v) && v.length >= (q.min ?? 1);
  }
}

/** Toggle an option in a multi/ranked answer, honouring exclusive options and max. */
export function toggleOption(q: Question, current: string[], optionId: string): string[] {
  const opt = q.options?.find((o) => o.id === optionId);
  if (current.includes(optionId)) return current.filter((id) => id !== optionId);
  if (opt?.exclusive) return [optionId];
  const exclusiveIds = new Set((q.options ?? []).filter((o) => o.exclusive).map((o) => o.id));
  const next = current.filter((id) => !exclusiveIds.has(id));
  if (q.max && next.length >= q.max) return next; // full: ignore
  return [...next, optionId];
}

/**
 * Remove answers to questions that are no longer shown, and option values that
 * are no longer offered. Called before scoring so stale branches never count.
 */
export function pruneAnswers(answers: Answers): Answers {
  let current = { ...answers };
  // Iterate because hiding one question can hide another that depended on it.
  for (let i = 0; i < 5; i++) {
    const visible = new Set(visibleQuestions(current).map((q) => q.id));
    let changed = false;
    for (const id of Object.keys(current)) {
      const q = QUESTIONS_BY_ID[id];
      if (!q || !visible.has(id)) {
        delete current[id];
        changed = true;
        continue;
      }
      const v = current[id];
      if (Array.isArray(v) && q.options) {
        const allowed = new Set(visibleOptions(q, current).map((o) => o.id));
        const filtered = v.filter((x) => allowed.has(x));
        if (filtered.length !== v.length) {
          current = { ...current, [id]: filtered };
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return current;
}

export function nextQuestionId(currentId: string, answers: Answers): string | null {
  const list = visibleQuestions(answers);
  const i = list.findIndex((q) => q.id === currentId);
  return list[i + 1]?.id ?? null;
}

export function previousQuestionId(currentId: string, answers: Answers): string | null {
  const list = visibleQuestions(answers);
  const i = list.findIndex((q) => q.id === currentId);
  return i > 0 ? list[i - 1].id : null;
}

/** 0..1 progress through the answerable part of the check. */
export function progress(currentId: string, answers: Answers): number {
  const list = visibleQuestions(answers).filter((q) => q.section !== "intro");
  const i = list.findIndex((q) => q.id === currentId);
  if (i < 0) return 0;
  return (i + 1) / (list.length + 1);
}
