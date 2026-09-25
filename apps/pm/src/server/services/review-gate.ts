// Pure review-gate logic for the PM tool (PRD: nothing reaches DONE without
// a recorded human review of the AI-heavy codegen).
//
// Kept dependency-free so it can be unit-verified with plain node
// (`pnpm --filter @arko/pm run verify:gate`) and reused by the tRPC router.

export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

export interface ReviewRecordLike {
  id: string;
  taskId: string;
  reviewerId: string;
  prLink: string;
}

/** The review gate error message surfaced inline on the board. */
export const REVIEW_GATE_MESSAGE =
  "Review required: add a reviewer and PR link before this task can be Done.";

/**
 * Whether a task may transition to DONE.
 * Gate: at least one review record exists for the task.
 * (Blocker dependencies are checked separately by the router.)
 */
export function canMarkDone(reviewCount: number): boolean {
  return reviewCount > 0;
}

/**
 * Throws REVIEW_GATE_MESSAGE when the gate blocks the DONE transition.
 * Returns normally when the transition is allowed.
 */
export function assertCanMarkDone(reviewCount: number): void {
  if (!canMarkDone(reviewCount)) {
    throw new Error(REVIEW_GATE_MESSAGE);
  }
}

/** Statuses a task may hold. DONE is gated; the rest are free. */
export function isGatedTransition(from: TaskStatus, to: TaskStatus): boolean {
  return to === "DONE" && from !== "DONE";
}
