import type { McqOptionKey, OptionOrderMap } from "@exam-platform/shared";

export function shuffleArray<T>(items: T[]) {
  const clone = [...items];

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }

  return clone;
}

export function createOptionOrderMap(): OptionOrderMap {
  const original: McqOptionKey[] = ["A", "B", "C", "D"];
  const shuffled = shuffleArray(original);

  return {
    A: shuffled[0],
    B: shuffled[1],
    C: shuffled[2],
    D: shuffled[3]
  };
}
