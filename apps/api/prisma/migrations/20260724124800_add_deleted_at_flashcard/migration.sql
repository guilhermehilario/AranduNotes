-- Migration: Add deletedAt to Flashcard model
ALTER TABLE "Flashcard" ADD COLUMN "deletedAt" DATETIME;
