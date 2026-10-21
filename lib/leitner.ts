/**
 * Leitner scheduling.
 * A card sits in box 1–5. Correct → up one box, due after that box's interval.
 * Missed → back to box 1, due tomorrow.
 * Practice mode (reviewing cards that aren't due): a correct answer changes nothing,
 * a miss still sends the card back to box 1.
 */
export const BOX_INTERVAL_DAYS = [1, 2, 4, 8, 16] as const; // index = box - 1
export const MAX_BOX = BOX_INTERVAL_DAYS.length;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ScheduleResult = { box: number; dueAt: Date } | null; // null = leave unchanged

export function schedule(
  box: number,
  correct: boolean,
  practice: boolean,
  now: Date = new Date(),
): ScheduleResult {
  if (!correct) {
    return { box: 1, dueAt: new Date(now.getTime() + BOX_INTERVAL_DAYS[0] * DAY_MS) };
  }
  if (practice) return null;
  const next = Math.min(box + 1, MAX_BOX);
  return { box: next, dueAt: new Date(now.getTime() + BOX_INTERVAL_DAYS[next - 1] * DAY_MS) };
}
