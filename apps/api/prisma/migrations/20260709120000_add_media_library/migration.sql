-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('active', 'trash', 'unattached');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('image', 'document', 'video', 'audio', 'other');

-- CreateTable
CREATE TABLE "Media" (
    "id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_extension" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "alt_text" TEXT,
    "title" TEXT,
    "caption" TEXT,
    "description" TEXT,
    "uploaded_by" UUID,
    "folder" TEXT NOT NULL DEFAULT '/',
    "status" "MediaStatus" NOT NULL DEFAULT 'active',
    "kind" "MediaKind" NOT NULL DEFAULT 'other',
    "thumbnails" JSONB,
    "metadata" JSONB,
    "shortcode" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_media_file_name" ON "Media"("file_name");

-- CreateIndex
CREATE INDEX "idx_media_mime_type" ON "Media"("mime_type");

-- CreateIndex
CREATE INDEX "idx_media_uploaded_by" ON "Media"("uploaded_by");

-- CreateIndex
CREATE INDEX "idx_media_status" ON "Media"("status");

-- CreateIndex
CREATE INDEX "idx_media_created_at" ON "Media"("created_at");

-- CreateIndex
CREATE INDEX "idx_media_kind" ON "Media"("kind");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;