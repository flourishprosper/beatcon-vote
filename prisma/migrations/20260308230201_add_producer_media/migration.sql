-- CreateTable
CREATE TABLE "ProducerMedia" (
    "id" TEXT NOT NULL,
    "producer_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "display_name" TEXT,
    "size_bytes" INTEGER,
    "mime_type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProducerMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProducerMedia_producer_id_idx" ON "ProducerMedia"("producer_id");

-- AddForeignKey
ALTER TABLE "ProducerMedia" ADD CONSTRAINT "ProducerMedia_producer_id_fkey" FOREIGN KEY ("producer_id") REFERENCES "Producer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
