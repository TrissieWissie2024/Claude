import {
  finderQuestions,
  recommendScent,
  type FinderAnswers,
  type FinderQuestion,
  type ScentSlug,
} from "@/content/finder";

/**
 * State of the scent finder quiz (brief §6.9, D23): one question at a time,
 * then the result. Pure, so content/finder.test.ts can walk every path through
 * the quiz without a browser (vitest only collects lib/ and content/ tests).
 *
 * - `step` 0 ... questions.length - 1 is a question; questions.length is the result.
 * - Next only moves on once the current question has a valid answer;
 *   otherwise `missing` is set and the UI shows finder.labels.pickOne.
 * - Back keeps every answer, so going forward again shows the earlier choice.
 * - Restart clears the answers and returns to the first question.
 * - `moves` counts step changes. The UI keys the step on it (so each step
 *   mounts fresh and its entry transition replays) and only moves the focus
 *   when it changed.
 */

export interface FinderState {
  step: number;
  answers: FinderAnswers;
  /** True after Next was pressed without an answer. Cleared by any choice or step change. */
  missing: boolean;
  moves: number;
}

export type FinderAction =
  /** Choose an option of the current question. Unknown ids are ignored. */
  | { type: "select"; optionId: string }
  | { type: "next" }
  | { type: "back" }
  | { type: "restart" };

export const initialFinderState: FinderState = { step: 0, answers: {}, missing: false, moves: 0 };

/** The question on screen, or null on the result step. */
export function getCurrentQuestion(
  state: FinderState,
  questions: readonly FinderQuestion[] = finderQuestions,
): FinderQuestion | null {
  return questions[state.step] ?? null;
}

/** True on the result step. */
export function isResultStep(state: FinderState, questions: readonly FinderQuestion[] = finderQuestions): boolean {
  return state.step >= questions.length;
}

/** The chosen option id of a question, if it is one of its options. */
export function getAnswer(state: FinderState, question: FinderQuestion): string | null {
  const optionId = state.answers[question.id];
  return question.options.some((option) => option.id === optionId) ? (optionId ?? null) : null;
}

/** The recommended scent on the result step, otherwise null. Deterministic (recommendScent). */
export function getFinderResult(
  state: FinderState,
  questions: readonly FinderQuestion[] = finderQuestions,
): ScentSlug | null {
  return isResultStep(state, questions) ? recommendScent(state.answers, [...questions]) : null;
}

export function finderReducer(
  state: FinderState,
  action: FinderAction,
  questions: readonly FinderQuestion[] = finderQuestions,
): FinderState {
  const question = getCurrentQuestion(state, questions);

  switch (action.type) {
    case "select": {
      if (!question || !question.options.some((option) => option.id === action.optionId)) return state;
      return { ...state, answers: { ...state.answers, [question.id]: action.optionId }, missing: false };
    }
    case "next": {
      if (!question) return state;
      if (getAnswer(state, question) === null) return state.missing ? state : { ...state, missing: true };
      return { ...state, step: state.step + 1, missing: false, moves: state.moves + 1 };
    }
    case "back": {
      if (state.step === 0) return state;
      return { ...state, step: state.step - 1, missing: false, moves: state.moves + 1 };
    }
    case "restart":
      return { step: 0, answers: {}, missing: false, moves: state.moves + 1 };
  }
}
