/*
  Warnings:

  - You are about to drop the column `participantAId` on the `Matchup` table. All the data in the column will be lost.
  - You are about to drop the column `participantBId` on the `Matchup` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "MatchupParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchupId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatchupParticipant_matchupId_fkey" FOREIGN KEY ("matchupId") REFERENCES "Matchup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MatchupParticipant_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrate existing participantA/participantB into MatchupParticipant (before dropping columns)
INSERT INTO "MatchupParticipant" ("id", "matchupId", "participantId", "slotIndex", "createdAt")
SELECT "id" || '_slot0', "id", "participantAId", 0, datetime('now') FROM "Matchup" WHERE "participantAId" IS NOT NULL;
INSERT INTO "MatchupParticipant" ("id", "matchupId", "participantId", "slotIndex", "createdAt")
SELECT "id" || '_slot1', "id", "participantBId", 1, datetime('now') FROM "Matchup" WHERE "participantBId" IS NOT NULL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Matchup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "orderInRound" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "voteEndsAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Matchup_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Matchup_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Matchup" ("createdAt", "eventId", "id", "orderInRound", "roundId", "status", "voteEndsAt") SELECT "createdAt", "eventId", "id", "orderInRound", "roundId", "status", "voteEndsAt" FROM "Matchup";
DROP TABLE "Matchup";
ALTER TABLE "new_Matchup" RENAME TO "Matchup";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "MatchupParticipant_matchupId_idx" ON "MatchupParticipant"("matchupId");

-- CreateIndex
CREATE INDEX "MatchupParticipant_participantId_idx" ON "MatchupParticipant"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchupParticipant_matchupId_slotIndex_key" ON "MatchupParticipant"("matchupId", "slotIndex");
