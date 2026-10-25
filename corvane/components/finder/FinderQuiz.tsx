"use client";

import { ArrowLeft, ArrowRight, Check, CircleAlert, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useId, useReducer, useRef, type Ref } from "react";

import { useCartActions } from "@/components/cart/CartProvider";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { StickRender } from "@/components/media/StickRender";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { finder, finderQuestions, type FinderQuestion } from "@/content/finder";
import { pdp } from "@/content/pdp";
import { getFromPrice } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import type { StickProduct } from "@/lib/types";

import {
  finderReducer,
  getAnswer,
  getCurrentQuestion,
  getFinderResult,
  initialFinderState,
  type FinderAction,
  type FinderState,
} from "./finderState";
import { finderTones, type FinderTone, type FinderToneClasses } from "./tones";

/**
 * The scent finder quiz (brief §6.9, D23): three questions, one at a time,
 * then one recommended scent. Client-side and deterministic (recommendScent
 * in content/finder.ts); nothing is stored and no email is asked.
 *
 * - Each question is a <form> with a native radio group in a fieldset whose
 *   legend holds the question heading (h3). Arrow keys move between options;
 *   Next is the submit button, so Enter submits where the browser allows it.
 *   Next without a choice keeps the step and says "Pick one to continue." in a
 *   polite live region; there are no disabled buttons.
 * - Every step change moves the focus to the new step's heading (without a
 *   scroll jump; the panel is scrolled back into view when its top went under
 *   the sticky header) and a status region announces "Question 2 of 3" or
 *   "Your scent: North Swell". The focus only moves after a step change made
 *   here, never on mount or when Activity shows the route again.
 * - The panel has a fixed minimum height per breakpoint that holds the tallest
 *   step (the result), and the buttons sit at its foot, so moving between
 *   steps never shifts the page. The first question is in the static HTML.
 * - Option tiles take their selected look from :has(:checked), so a choice
 *   made before hydration already shows.
 * - Steps fade and rise in on change (motion-safe only, never on first paint).
 * - The result: the stick (open, in its ring colour), name, family, the one
 *   stick price (getFromPrice), the "why" line, the notes, Add to cart (one
 *   stick, one-time, opens the cart drawer), a link to the product page,
 *   Start again, and the Discovery Set as the way out.
 */

export interface FinderQuizProps {
  /** Surface of the surrounding section. Default "deep". */
  tone?: FinderTone;
  className?: string;
}

/**
 * Minimum panel height: the tallest result step (of all six scents) at the
 * narrowest width of each range, measured with Playwright from 320 to 1920 px:
 * 705 px below 360 px, 650 px from 360, 624 px from 375, 554 px from sm (640),
 * 591 px from lg (1024). Question steps are shorter and keep the spare room
 * above their buttons. With larger text the panel grows instead of clipping.
 */
const PANEL_MIN_HEIGHT =
  "min-h-[44.0625rem] min-[22.5rem]:min-h-[40.625rem] min-[23.4375rem]:min-h-[39rem] sm:min-h-[34.625rem] lg:min-h-[37rem]";

const KEYFRAMES =
  "@keyframes corvane-finder-in{from{opacity:0;transform:translate3d(0,10px,0)}to{opacity:1;transform:none}}" +
  "@keyframes corvane-finder-rise{from{opacity:0;transform:translate3d(0,16px,0)}to{opacity:1;transform:none}}";

const STEP_ENTER = "motion-safe:animate-[corvane-finder-in_420ms_cubic-bezier(0.22,1,0.36,1)_both]";
const STICK_ENTER = "motion-safe:animate-[corvane-finder-rise_640ms_cubic-bezier(0.22,1,0.36,1)_both]";

const NOTE_TIERS = ["top", "heart", "base"] as const;

/** finderReducer with the default questions, in the (state, action) shape useReducer expects. */
function reduceFinder(state: FinderState, action: FinderAction): FinderState {
  return finderReducer(state, action);
}

export function FinderQuiz({ tone = "deep", className }: FinderQuizProps) {
  const t = finderTones[tone];
  const [state, dispatch] = useReducer(reduceFinder, initialFinderState);
  const { findStick, sticks } = useCatalog();
  const { addLine } = useCartActions();
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusOnMove = useRef(false);

  const total = finderQuestions.length;
  const question = getCurrentQuestion(state);
  const resultSlug = getFinderResult(state);
  const stick = resultSlug ? (findStick(resultSlug) ?? sticks[0] ?? null) : null;

  const announcement =
    state.moves === 0
      ? ""
      : stick
        ? finder.result.heading(stick.name)
        : question
          ? finder.labels.progress(state.step + 1, total)
          : "";

  useEffect(() => {
    if (!focusOnMove.current) return;
    focusOnMove.current = false;
    headingRef.current?.focus({ preventScroll: true });
    const panel = panelRef.current;
    if (!panel) return;
    // scroll-padding-top on <html> is the sticky header plus a margin; scrollIntoView honours it.
    const offset = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    if (panel.getBoundingClientRect().top < offset) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      panel.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    }
  }, [state.moves]);

  const send = (action: FinderAction) => {
    if (reduceFinder(state, action).moves !== state.moves) focusOnMove.current = true;
    dispatch(action);
  };

  const addToCart = (product: StickProduct) => {
    addLine({ kind: "stick", scents: [product.slug], plan: { type: "one-time" }, quantity: 1 }, { open: true });
  };

  return (
    <div
      ref={panelRef}
      className={cn("relative flex flex-col rounded-card p-5 sm:p-8 lg:p-10", PANEL_MIN_HEIGHT, t.panel, className)}
    >
      <style href="corvane-finder-motion" precedence="default">
        {KEYFRAMES}
      </style>
      <p role="status" className="sr-only">
        {announcement}
      </p>

      <div key={state.moves} className={cn("flex flex-1 flex-col", state.moves > 0 && STEP_ENTER)}>
        {question ? (
          <QuestionStep
            question={question}
            index={state.step}
            total={total}
            answer={getAnswer(state, question)}
            missing={state.missing}
            t={t}
            headingRef={headingRef}
            onSelect={(optionId) => send({ type: "select", optionId })}
            onNext={() => send({ type: "next" })}
            onBack={() => send({ type: "back" })}
          />
        ) : stick ? (
          <ResultStep
            stick={stick}
            total={total}
            t={t}
            headingRef={headingRef}
            onAdd={() => addToCart(stick)}
            onRestart={() => send({ type: "restart" })}
          />
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

function ProgressBar({ filled, total, t }: { filled: number; total: number; t: FinderToneClasses }) {
  return (
    // May shrink (to 3rem), so with large text the step label keeps its room.
    <span aria-hidden="true" className="flex w-20 min-w-12 shrink gap-1.5 sm:w-24">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-[3px] flex-1 rounded-full transition-colors duration-300 forced-colors:bg-[CanvasText]",
            index < filled ? t.progressOn : cn(t.progressOff, "forced-colors:opacity-40"),
          )}
        />
      ))}
    </span>
  );
}

interface QuestionStepProps {
  question: FinderQuestion;
  index: number;
  total: number;
  answer: string | null;
  missing: boolean;
  t: FinderToneClasses;
  headingRef: Ref<HTMLHeadingElement>;
  onSelect: (optionId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

function QuestionStep({
  question,
  index,
  total,
  answer,
  missing,
  t,
  headingRef,
  onSelect,
  onNext,
  onBack,
}: QuestionStepProps) {
  const name = useId();
  const hintId = useId();
  const last = index === total - 1;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onNext();
      }}
      className="flex flex-1 flex-col"
    >
      <div className="flex items-center justify-between gap-4">
        <p className={cn("label-caps tabular", t.soft)}>{finder.labels.progress(index + 1, total)}</p>
        <ProgressBar filled={index + 1} total={total} t={t} />
      </div>

      <fieldset aria-describedby={missing ? hintId : undefined} className="mt-6 min-w-0 md:mt-8">
        <legend className="w-full">
          <h3
            ref={headingRef}
            tabIndex={-1}
            className={cn("w-fit max-w-full text-[1.75rem] leading-[1.1] md:text-[2.25rem] md:leading-[1.08] xl:text-[2.5rem]", t.strong)}
          >
            {question.prompt}
          </h3>
        </legend>

        <div className="mt-6 grid gap-2.5 sm:grid-cols-2 sm:gap-3 md:mt-8">
          {question.options.map((option) => (
            <label key={option.id} className={t.tile}>
              <input
                type="radio"
                name={name}
                value={option.id}
                checked={answer === option.id}
                onChange={() => onSelect(option.id)}
                className="sr-only"
              />
              <span aria-hidden="true" className={t.mark}>
                <Check className="size-3 opacity-0 group-has-checked:opacity-100" strokeWidth={3} />
              </span>
              <span className="min-w-0 flex-1">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-auto pt-6 md:pt-8">
        <p id={hintId} aria-live="polite" className={cn("text-sm font-medium", t.strong)}>
          {missing ? (
            <span className="mb-3 flex items-center gap-2">
              <CircleAlert aria-hidden="true" className="size-4 shrink-0" strokeWidth={2} />
              {finder.labels.pickOne}
            </span>
          ) : null}
        </p>
        <div className="flex items-center gap-3">
          {index > 0 ? (
            <Button
              variant={t.ghost}
              onClick={onBack}
              iconStart={<ArrowLeft aria-hidden="true" className="size-4" strokeWidth={1.75} />}
              className="-ml-3 px-4 sm:-ml-4"
            >
              {finder.labels.back}
            </Button>
          ) : null}
          <Button
            type="submit"
            variant={t.next}
            iconEnd={<ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.75} />}
            className="ml-auto"
          >
            {last ? finder.labels.showResult : finder.labels.next}
          </Button>
        </div>
      </div>
    </form>
  );
}

interface ResultStepProps {
  stick: StickProduct;
  total: number;
  t: FinderToneClasses;
  headingRef: Ref<HTMLHeadingElement>;
  onAdd: () => void;
  onRestart: () => void;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function ResultStep({ stick, total, t, headingRef, onAdd, onRestart }: ResultStepProps) {
  const why = finder.result.why[stick.slug as keyof typeof finder.result.why];
  const glow = {
    backgroundImage: `radial-gradient(62% 44% at 50% 64%, ${stick.ringColor}${t.glowAlpha}, transparent 72%)`,
  };
  // 14 px on phones, so "View Drift & Ember" and "Start again" share one row from 360 px.
  const textLink =
    "inline-flex min-h-11 items-center gap-1.5 rounded-full text-sm font-semibold underline underline-offset-4 transition-[text-decoration-color] duration-200 sm:text-[0.9375rem]";

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-4">
        <p className={cn("label-caps", t.soft)}>{finder.result.eyebrow}</p>
        <ProgressBar filled={total} total={total} t={t} />
      </div>

      <div className="mt-6 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-5 gap-y-5 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-x-8 md:mt-8 lg:grid-cols-[11.5rem_minmax(0,1fr)]">
        <div
          className={cn(
            "relative col-start-1 row-start-1 min-h-36 overflow-hidden rounded-[0.75rem] sm:row-span-2 sm:min-h-0",
            t.specimen,
          )}
        >
          <div aria-hidden="true" className="absolute inset-0" style={glow} />
          <div className={cn("absolute inset-x-0 top-[10%] bottom-[8%] flex justify-center", STICK_ENTER)}>
            <StickRender ringColor={stick.ringColor} variant="open" rimLight={t.rimLight} className="h-full w-auto" />
          </div>
        </div>

        <div className="col-start-2 row-start-1 self-center sm:self-start">
          <h3
            ref={headingRef}
            tabIndex={-1}
            className={cn(
              "w-fit max-w-full text-[1.875rem] leading-[1.04] tracking-[-0.02em] sm:text-[2.5rem] lg:text-[2.75rem]",
              t.strong,
            )}
          >
            {stick.name}
          </h3>
          <p className={cn("label-caps mt-3 flex items-center gap-2", t.soft)}>
            <span
              aria-hidden="true"
              className={cn("inline-block size-2 shrink-0 rounded-full ring-1", t.dot)}
              style={{ backgroundColor: stick.ringColor }}
            />
            {pdp.family(stick.family)}
          </p>
          <p className="mt-4 flex flex-wrap items-baseline gap-x-2.5">
            <Price amount={getFromPrice(stick)} size="lg" tone={t.heading} />
            <span className={cn("text-sm", t.soft)}>{pdp.priceSize.stick}</span>
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 sm:col-start-2 sm:row-start-2">
          <p className={cn("max-w-[34rem] text-base leading-relaxed", t.soft)}>{why}</p>
          <dl className={cn("mt-5 grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-4 gap-y-1 border-t pt-4 text-sm leading-5 sm:gap-y-1.5", t.rule)}>
            {NOTE_TIERS.map((tier) => (
              <Fragment key={tier}>
                <dt className={t.soft}>{pdp.notes[tier]}</dt>
                <dd className={cn("font-medium", t.strong)}>{capitalise(stick.notes[tier].join(", "))}</dd>
              </Fragment>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-auto pt-6 md:pt-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-6">
          <Button variant="primary" onClick={onAdd} className="w-full sm:w-auto">
            {finder.result.addToCart}
          </Button>
          <Link href={`/products/${stick.slug}`} className={cn(textLink, t.link)}>
            {finder.result.viewProduct(stick.name)}
            <ArrowRight aria-hidden="true" className="hidden size-4 sm:block" strokeWidth={1.75} />
          </Link>
          <button
            type="button"
            onClick={onRestart}
            className={cn(
              "ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-full text-sm font-semibold transition-colors duration-200 sm:text-[0.9375rem]",
              t.soft,
              t.heading === "dark" ? "hover:text-fog" : "hover:text-ink",
            )}
          >
            <RotateCcw aria-hidden="true" className="size-4" strokeWidth={1.75} />
            {finder.result.retake}
          </button>
        </div>
        <p className={cn("mt-3 border-t pt-3 text-sm leading-relaxed sm:mt-4 sm:pt-4", t.rule, t.soft)}>
          {finder.result.discovery}{" "}
          <Link
            href={finder.result.discoveryLink.href}
            className={cn("font-semibold whitespace-nowrap underline underline-offset-4", t.link)}
          >
            {finder.result.discoveryLink.label}
          </Link>
        </p>
      </div>
    </div>
  );
}
