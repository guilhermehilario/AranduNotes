import type { Flashcard } from "../types";

export type ReviewItemType = "flashcard" | "question";

export interface ReviewItem {
  type: ReviewItemType;
  data:
    | Flashcard
    | {
        id: string;
        question: string;
        correctAnswer: string;
        options: string;
        explanation: string | null;
      };
}
