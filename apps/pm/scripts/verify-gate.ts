// Verifies the PRD review gate (success criteria SC2–SC3 logic layer).
// Run: pnpm --filter @arko/pm run verify:gate
import {
  canMarkDone,
  assertCanMarkDone,
  isGatedTransition,
  REVIEW_GATE_MESSAGE,
} from "../src/server/services/review-gate.ts";

let failures = 0;

function check(name: string, cond: boolean) {
  if (cond) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.error(`FAIL  ${name}`);
  }
}

check("0 reviews -> blocked", canMarkDone(0) === false);
check("1 review -> allowed", canMarkDone(1) === true);
check("3 reviews -> allowed", canMarkDone(3) === true);

let threwWithRightMessage = false;
try {
  assertCanMarkDone(0);
} catch (e) {
  threwWithRightMessage = e instanceof Error && e.message === REVIEW_GATE_MESSAGE;
}
check("assertCanMarkDone(0) throws gate message", threwWithRightMessage);

let passedSilently = false;
try {
  assertCanMarkDone(1);
  passedSilently = true;
} catch {
  passedSilently = false;
}
check("assertCanMarkDone(1) does not throw", passedSilently);

check(
  "moving TODO -> DONE is gated",
  isGatedTransition("TODO", "DONE") === true,
);
check(
  "moving REVIEW -> DONE is gated",
  isGatedTransition("REVIEW", "DONE") === true,
);
check(
  "moving TODO -> REVIEW is not gated",
  isGatedTransition("TODO", "REVIEW") === false,
);
check(
  "DONE -> DONE is not gated",
  isGatedTransition("DONE", "DONE") === false,
);

if (failures > 0) {
  console.error(`\n${failures} gate check(s) FAILED`);
  process.exit(1);
}
console.log("\nAll gate checks passed.");
