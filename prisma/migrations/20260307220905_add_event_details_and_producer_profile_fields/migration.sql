-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "event_ends_at" TIMESTAMP(3),
ADD COLUMN     "event_starts_at" TIMESTAMP(3),
ADD COLUMN     "state" TEXT,
ADD COLUMN     "venue_name" TEXT,
ADD COLUMN     "zip" TEXT;

-- AlterTable
ALTER TABLE "Producer" ADD COLUMN     "apple_music_url" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "sound_cloud_url" TEXT,
ADD COLUMN     "spotify_url" TEXT,
ADD COLUMN     "twitter_handle" TEXT,
ADD COLUMN     "website_url" TEXT;
