-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "acceptsProducerRegistration" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Producer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "stage_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "instagram_handle" TEXT,
    "city_state" TEXT,
    "years_producing" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "production_style" TEXT NOT NULL,
    "image_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProducerEventSignup" (
    "id" TEXT NOT NULL,
    "producer_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "agree_rules" BOOLEAN NOT NULL,
    "agree_original" BOOLEAN NOT NULL,
    "agree_time_limits" BOOLEAN NOT NULL,
    "participant_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProducerEventSignup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Producer_email_key" ON "Producer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Producer_slug_key" ON "Producer"("slug");

-- CreateIndex
CREATE INDEX "ProducerEventSignup_event_id_idx" ON "ProducerEventSignup"("event_id");

-- CreateIndex
CREATE INDEX "ProducerEventSignup_producer_id_idx" ON "ProducerEventSignup"("producer_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProducerEventSignup_producer_id_event_id_key" ON "ProducerEventSignup"("producer_id", "event_id");

-- AddForeignKey
ALTER TABLE "ProducerEventSignup" ADD CONSTRAINT "ProducerEventSignup_producer_id_fkey" FOREIGN KEY ("producer_id") REFERENCES "Producer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProducerEventSignup" ADD CONSTRAINT "ProducerEventSignup_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
