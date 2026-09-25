"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, type ReactNode } from "react";
import { GOALS_BY_ID, deriveProfile, profileFlags, pruneAnswers, type Answers } from "@/engine";
import { summarise } from "@/engine/advice";
import { Alert } from "@/components/ui/icons";

const PLAN_SIZE: Record<string, string> = {
  one: "One product to start",
  focused: "A focused plan of two or three",
  complete: "A complete plan",
};

/**
 * "What you've told us", building up as the customer answers (large screens). It shows,
 * in their own terms, exactly what the suggestions will be based on, which is most of
 * what makes the result feel explained rather than pulled from a hat.
 */
export function SoFar({ answers }: { answers: Answers }) {
  const view = useMemo(() => {
    const clean = pruneAnswers(answers);
    const p = deriveProfile(clean);
    const lifestyle = summarise(p).slice(1);
    return {
      who: [p.name, p.age ? `${p.age}` : null].filter(Boolean).join(", "),
      goals: p.goals.map((g) => GOALS_BY_ID[g]?.label).filter(Boolean) as string[],
      lifestyle,
      flags: profileFlags(p),
      plan: typeof clean.plan_size === "string" ? PLAN_SIZE[clean.plan_size] : null,
    };
  }, [answers]);

  const empty = !view.who && !view.goals.length && !view.flags.length;

  return (
    <div>
      <h2 className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-white/50">What you&apos;ve told us</h2>
      {empty ? (
        <p className="mt-4 max-w-[22rem] text-[0.95rem] leading-relaxed text-white/60">
          As you answer, what your suggestions will be based on appears here, so you can see exactly what&apos;s being used.
        </p>
      ) : (
        <dl className="mt-5 grid gap-5">
          <AnimatePresence initial={false}>
            {view.who && (
              <Row key="who" label="You">
                {view.who}
              </Row>
            )}
            {view.goals.length > 0 && (
              <Row key="goals" label="Looking for help with">
                <div className="flex flex-wrap gap-1.5">
                  {view.goals.map((g, i) => (
                    <span key={g} className="rounded-full bg-white/10 px-2.5 py-1 text-[0.85rem]">
                      <span className="text-white/50">{i + 1}.</span> {g}
                    </span>
                  ))}
                </div>
              </Row>
            )}
            {view.lifestyle.length > 0 && (
              <Row key="life" label="Daily life">
                {view.lifestyle.map((l) => l.replace(/^You also told us /, "").replace(/^./, (c) => c.toUpperCase()))}
              </Row>
            )}
            {view.flags.length > 0 && (
              <Row key="flags" label="We'll take care around">
                <ul className="grid gap-1.5">
                  {view.flags.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Alert className="h-3.5 w-3.5 shrink-0 text-[#f0b48a]" /> {f}
                    </li>
                  ))}
                </ul>
              </Row>
            )}
            {view.plan && (
              <Row key="plan" label="Starting with">
                {view.plan}
              </Row>
            )}
          </AnimatePresence>
        </dl>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="border-t border-white/10 pt-3"
    >
      <dt className="text-[0.78rem] text-white/45">{label}</dt>
      <dd className="mt-1.5 text-[0.95rem] leading-snug text-white/90">{children}</dd>
    </motion.div>
  );
}
