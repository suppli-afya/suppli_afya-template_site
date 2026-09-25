"use client";

import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  QUESTIONS_BY_ID,
  SECTIONS,
  isAnswered,
  nextQuestionId,
  previousQuestionId,
  resolveText,
  toggleOption,
  visibleOptions,
  visibleQuestions,
  type Answers,
  type EngineContext,
  type Question,
} from "@/engine";
import { Portrait } from "@/components/brand/Portrait";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Button } from "@/components/ui/Button";
import { Bag, ChevronLeft, Close, Lock, Shield } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import { MultiChoice, Scale, SingleChoice, TextField } from "./inputs";
import { Results } from "./Results";
import { SoFar } from "./SoFar";

/*
 * The selector: the engine's question flow, as a focused full-screen tool.
 *
 * The engine decides everything (which questions, in which order, what counts as answered,
 * what's recommended). This component only renders it. The driving logic follows the Suppli
 * Afya health check (suppli_afya-main_site: src/components/check/HealthCheck.tsx) with two
 * presentation changes for a storefront:
 *   - The engine's welcome screen is replaced by the page itself; the flow opens on its
 *     privacy and "not medical advice" screen, which still has to be accepted.
 *   - Section screens ("Your goals", "A quick safety check") are shown as a header on the
 *     question that follows them instead of as a screen of their own: the same words, four
 *     fewer taps.
 */

const FIRST = "disclaimer";
const LAST = "plan_size";
const ease = [0.22, 1, 0.36, 1] as const;

const isFolded = (q: Question | undefined) => Boolean(q && q.kind === "section" && q.section !== "intro");

function nextShown(id: string, a: Answers): string | null {
  let n = nextQuestionId(id, a);
  while (n && isFolded(QUESTIONS_BY_ID[n])) n = nextQuestionId(n, a);
  return n;
}

function previousShown(id: string, a: Answers): string | null {
  let p = previousQuestionId(id, a);
  while (p && isFolded(QUESTIONS_BY_ID[p])) p = previousQuestionId(p, a);
  return p && QUESTIONS_BY_ID[p].id !== "welcome" ? p : null;
}

/** Goals can be picked on the page before sex is known; drop any the engine wouldn't offer. */
function tidy(a: Answers): Answers {
  if (!Array.isArray(a.goals)) return a;
  const allowed = new Set(visibleOptions(QUESTIONS_BY_ID.goals, a).map((o) => o.id));
  const goals = a.goals.filter((g) => allowed.has(g));
  return goals.length === a.goals.length ? a : { ...a, goals };
}

export function SelectorOverlay() {
  const { overlays, close } = useStorefront();
  return (
    <Sheet open={overlays.selector} onClose={() => close("selector")} kind="screen" z={40} label="Help me choose">
      <Selector />
    </Sheet>
  );
}

function Selector() {
  const { sf, session, setSession, setOutcome, result, outcome, close, priced, openOrder } = useStorefront();
  const reduce = useReducedMotion();
  const [dir, setDir] = useState<1 | -1>(1);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const answers = useMemo(() => session?.answers ?? {}, [session]);
  const currentId = session?.currentId && QUESTIONS_BY_ID[session.currentId] ? session.currentId : FIRST;
  const q = QUESTIONS_BY_ID[currentId];
  const ctx: EngineContext = useMemo(
    () => ({ distributorName: sf.distributor.name, distributorFirstName: sf.distributor.firstName }),
    [sf],
  );
  const showingResult = Boolean(result);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const toTop = () => scrollRef.current?.scrollTo({ top: 0 });

  const goTo = useCallback(
    (id: string, direction: 1 | -1, a: Answers) => {
      setDir(direction);
      setError(null);
      setTouched(true);
      setSession({ answers: a, currentId: id });
      toTop();
    },
    [setSession],
  );

  const finish = useCallback(
    (final: Answers) => {
      setDir(1);
      setOutcome({ answers: final, salt: String(Date.now()) });
      setSession(null);
      toTop();
    },
    [setOutcome, setSession],
  );

  const next = useCallback(
    (a: Answers = answers) => {
      if (!isAnswered(q, a)) {
        if (q.kind === "number") setError(`Please enter an age between ${q.range?.min} and ${q.range?.max}.`);
        if (q.kind === "text") setError("Please enter a name, even a nickname.");
        return;
      }
      const n = nextShown(currentId, a);
      if (!n || currentId === LAST) finish(a);
      else goTo(n, 1, a);
    },
    [answers, currentId, finish, goTo, q],
  );

  const back = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (showingResult && outcome) {
      // Change my answers: reopen the last question with everything filled in.
      setOutcome(null);
      goTo(LAST, -1, outcome.answers);
      return;
    }
    const p = previousShown(currentId, answers);
    if (p) goTo(p, -1, answers);
    else close("selector");
  }, [answers, close, currentId, goTo, outcome, setOutcome, showingResult]);

  const restart = useCallback(() => {
    setOutcome(null);
    goTo(FIRST, -1, {});
  }, [goTo, setOutcome]);

  const setValue = (id: string, value: Answers[string]) => {
    setError(null);
    setSession({ answers: tidy({ ...answers, [id]: value }), currentId });
  };

  const selectAndAdvance = (id: string, value: string | number) => {
    const updated = tidy({ ...answers, [id]: value });
    setSession({ answers: updated, currentId });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => next(updated), reduce ? 0 : 260);
  };

  const sectionProgress = useMemo(() => {
    const list = visibleQuestions(answers).filter((x) => x.section !== "intro" && !isFolded(x));
    const currentSection = SECTIONS.findIndex((x) => x.id === q?.section);
    return SECTIONS.map((s, i) => {
      const inSection = list.filter((x) => x.section === s.id);
      const idx = inSection.findIndex((x) => x.id === currentId);
      let fill = 0;
      if (showingResult) fill = 1;
      else if (i < currentSection) fill = 1;
      else if (i === currentSection && idx >= 0) fill = (idx + 1) / Math.max(1, inSection.length);
      return { ...s, fill, current: !showingResult && i === currentSection };
    });
  }, [answers, currentId, q?.section, showingResult]);

  const intro = !showingResult && q?.section === "intro";
  const d = sf.distributor;

  const header = (
    <div className="flex h-16 shrink-0 items-center gap-2 px-3 sm:px-5">
      <button
        type="button"
        onClick={back}
        aria-label={showingResult ? "Change my answers" : "Back"}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-ink/[0.06]"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="flex min-w-0 flex-1 items-center justify-center">
        {showingResult ? (
          <span className="truncate text-[0.95rem] font-semibold text-ink">Your suggestions</span>
        ) : (
          <div
            className={clsx("flex w-full max-w-md gap-1.5 transition-opacity duration-500", intro ? "opacity-0" : "opacity-100")}
            aria-hidden={intro}
            role="progressbar"
            aria-label="Progress"
            aria-valuemin={0}
            aria-valuemax={SECTIONS.length}
            aria-valuenow={sectionProgress.filter((s) => s.fill === 1).length}
          >
            {sectionProgress.map((s) => (
              <div key={s.id} className="flex-1">
                <div className="h-1 overflow-hidden rounded-full bg-ink/10">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={false}
                    animate={{ width: `${Math.round(s.fill * 100)}%` }}
                    transition={{ duration: 0.5, ease }}
                  />
                </div>
                <div className={clsx("mt-1.5 hidden text-[0.7rem] font-semibold sm:block", s.current ? "text-ink" : "text-ink-3")}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {priced.count > 0 && (
        <button
          type="button"
          onClick={openOrder}
          aria-label={`Your order: ${priced.count} item${priced.count > 1 ? "s" : ""}`}
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-ink/[0.06]"
        >
          <Bag />
          <span key={priced.count} className="price absolute right-0.5 top-0.5 grid h-[1.1rem] min-w-[1.1rem] animate-bump place-items-center rounded-full bg-accent px-1 text-[0.66rem] font-bold text-on-accent">
            {priced.count}
          </span>
        </button>
      )}
      <button
        type="button"
        onClick={() => close("selector")}
        aria-label="Close. Your answers are kept"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-ink/[0.06]"
      >
        <Close className="h-5 w-5" />
      </button>
    </div>
  );

  const slide = (key: string) =>
    reduce
      ? { key, initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }
      : {
          key,
          initial: { opacity: 0, x: 26 * dir },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -26 * dir },
          transition: { duration: 0.3, ease },
        };

  return (
    <div className="flex h-full min-h-0 bg-canvas">
      {/* Large screens: who you're doing this with, and what's been noted so far. */}
      {!showingResult && (
        <aside className="grain hidden w-[min(40%,30rem)] shrink-0 flex-col justify-between bg-night p-10 text-white lg:flex">
          <div className="flex items-center gap-3">
            <Portrait distributor={d} size="md" />
            <div className="leading-tight">
              <div className="text-[0.8rem] text-white/55">Help me choose, with</div>
              <div className="font-semibold">{d.name}</div>
            </div>
          </div>
          <div className="thin-scrollbar my-10 min-h-0 flex-1 overflow-y-auto">
            <SoFar answers={answers} />
          </div>
          <p className="flex items-start gap-2 text-[0.82rem] leading-snug text-white/50">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Your answers stay in this browser. {d.firstName} only sees them if you choose to send them.
          </p>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        <div ref={scrollRef} className="thin-scrollbar relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <AnimatePresence mode="wait" initial={false}>
            {showingResult && result ? (
              <motion.div {...slide("result")}>
                <Results result={result} answers={outcome!.answers} onEdit={back} onRestart={restart} />
              </motion.div>
            ) : (
              q && (
                <motion.div {...slide(q.id)} className="mx-auto flex min-h-full max-w-xl flex-col px-5 pb-6 pt-4 sm:px-8 sm:pt-10">
                  <QuestionView
                    q={q}
                    answers={answers}
                    ctx={ctx}
                    touched={touched}
                    error={error}
                    onValue={setValue}
                    onSelectAdvance={selectAndAdvance}
                    onNext={() => next()}
                  />
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function QuestionView({
  q,
  answers,
  ctx,
  touched,
  error,
  onValue,
  onSelectAdvance,
  onNext,
}: {
  q: Question;
  answers: Answers;
  ctx: EngineContext;
  touched: boolean;
  error: string | null;
  onValue: (id: string, v: Answers[string]) => void;
  onSelectAdvance: (id: string, v: string | number) => void;
  onNext: () => void;
}) {
  const prompt = resolveText(q.prompt, answers, ctx);
  const helper = resolveText(q.helper, answers, ctx);
  const options = visibleOptions(q, answers);
  const value = answers[q.id];
  const needsContinue = ["text", "number", "multi", "ranked"].includes(q.kind);
  const answered = isAnswered(q, answers);

  // The section screen just before this question becomes its header.
  const prevId = previousQuestionId(q.id, answers);
  const lead = prevId && isFolded(QUESTIONS_BY_ID[prevId]) ? QUESTIONS_BY_ID[prevId] : null;
  const part = SECTIONS.findIndex((s) => s.id === q.section) + 1;

  if (q.kind === "section") {
    // Only the privacy and "not medical advice" screen is shown on its own.
    return (
      <div className="flex flex-1 flex-col justify-center py-6">
        <span className="kicker">Help me choose</span>
        <h2 className="display-section mt-4 text-ink">{prompt}</h2>
        {helper && (
          <div className="mt-4 grid gap-3 text-[1rem] leading-relaxed text-ink-2">
            {helper.split("\n\n").map((para) => (
              <p key={para}>{para}</p>
            ))}
          </div>
        )}
        <ul className="mt-6 grid gap-2 text-[0.9rem] text-ink-2">
          <li className="flex items-center gap-2.5">
            <Shield className="h-4 w-4 shrink-0 text-accent" /> About 3 minutes. Most answers are a single tap.
          </li>
          <li className="flex items-center gap-2.5">
            <Lock className="h-4 w-4 shrink-0 text-accent" /> You can close this at any time; your answers are kept.
          </li>
        </ul>
        <div className="mt-9">
          <Button variant="accent" size="lg" onClick={onNext} arrow data-autofocus>
            {q.cta ?? "Continue"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {lead ? (
        <div className="mb-6">
          <span className="kicker">
            Part {part} of {SECTIONS.length}
          </span>
          <p className="mt-2.5 font-display text-[1.3rem] italic leading-snug text-accent">{resolveText(lead.prompt, answers, ctx)}</p>
          {lead.helper && <p className="mt-1 text-[0.92rem] leading-relaxed text-ink-2">{resolveText(lead.helper, answers, ctx)}</p>}
        </div>
      ) : null}

      <h2 className="font-display text-[1.8rem] leading-[1.12] tracking-[-0.02em] text-ink sm:text-[2.1rem]">{prompt}</h2>
      {helper && <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">{helper}</p>}

      <div className="mt-6">
        {q.kind === "single" && (
          <SingleChoice options={options} value={value as string | undefined} onSelect={(id) => onSelectAdvance(q.id, id)} />
        )}
        {q.kind === "scale" && (
          <Scale
            value={typeof value === "number" ? value : undefined}
            labels={q.scaleLabels ?? ["Low", "High"]}
            onSelect={(n) => onSelectAdvance(q.id, n)}
          />
        )}
        {(q.kind === "multi" || q.kind === "ranked") && (
          <MultiChoice
            q={q}
            options={options}
            value={Array.isArray(value) ? value : []}
            ranked={q.kind === "ranked"}
            onToggle={(id) => onValue(q.id, toggleOption(q, Array.isArray(value) ? value : [], id))}
          />
        )}
        {(q.kind === "text" || q.kind === "number") && (
          <TextField
            label={prompt}
            value={value === undefined ? "" : String(value)}
            numeric={q.kind === "number"}
            maxLength={q.range?.max}
            placeholder={q.placeholder}
            autoFocus={touched}
            invalid={error}
            onChange={(v) => onValue(q.id, q.kind === "number" ? (v === "" ? undefined : Number(v)) : v)}
            onSubmit={onNext}
          />
        )}
      </div>

      {q.why && (
        <p className="mt-5 flex items-start gap-2 text-[0.84rem] leading-snug text-ink-3">
          <Shield className="mt-px h-3.5 w-3.5 shrink-0 text-accent" />
          <span>
            <span className="font-semibold text-ink-2">Why we ask: </span>
            {q.why}
          </span>
        </p>
      )}

      {needsContinue && (
        <div className="safe-bottom sticky bottom-0 z-10 -mx-5 mt-auto bg-gradient-to-t from-canvas from-70% to-canvas/0 px-5 pt-6 sm:-mx-8 sm:px-8">
          <Button variant="primary" size="lg" className="w-full sm:w-auto sm:min-w-44" onClick={onNext} disabled={!answered} arrow>
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
