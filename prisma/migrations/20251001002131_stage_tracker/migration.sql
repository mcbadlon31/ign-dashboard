-- AlterTable
ALTER TABLE "Person" ADD COLUMN "currentStage" TEXT;
ALTER TABLE "Person" ADD COLUMN "stageSince" DATETIME;

-- CreateTable
CREATE TABLE "PersonStage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "enteredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PersonStage_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PersonStage_personId_stage_idx" ON "PersonStage"("personId", "stage");
