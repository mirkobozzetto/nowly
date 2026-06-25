-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "device_id" TEXT,
    "slug" TEXT,
    "version" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_daily_rollups" (
    "day" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "slug" TEXT NOT NULL DEFAULT '',
    "dimensions" JSONB NOT NULL DEFAULT '{}',
    "count" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "analytics_admins" (
    "discord_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_admins_pkey" PRIMARY KEY ("discord_id")
);

-- CreateTable
CREATE TABLE "devices" (
    "device_id" TEXT NOT NULL,
    "analytics_consent" BOOLEAN NOT NULL DEFAULT false,
    "extension_version" TEXT,
    "native_version" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "locale" TEXT,
    "first_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("device_id")
);

-- CreateTable
CREATE TABLE "device_presences" (
    "device_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "installed_version" TEXT,
    "installed" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "installed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalled_at" TIMESTAMPTZ(6),

    CONSTRAINT "device_presences_pkey" PRIMARY KEY ("device_id","slug")
);

-- CreateTable
CREATE TABLE "presence_active_devices" (
    "slug" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presence_active_devices_pkey" PRIMARY KEY ("slug","device_id")
);

-- CreateTable
CREATE TABLE "presence_active_sessions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "version" TEXT,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "duration_ms" INTEGER,
    "end_reason" TEXT,
    "last_heartbeat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presence_active_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presences" (
    "slug" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "version" TEXT,
    "added_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "presences_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "presence_versions" (
    "slug" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "changelog" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL DEFAULT 'unknown',
    "author_github" TEXT,
    "release_author" TEXT,
    "release_contributors" TEXT,
    "pr" TEXT,
    "source" TEXT,
    "commit_sha" TEXT,
    "changed_files" TEXT,
    "bundle_size_bytes" INTEGER,
    "bundle_size_label" TEXT,
    "bundle_sha256" TEXT,
    "version_type" TEXT,
    "ai_generated_changelog" BOOLEAN,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presence_versions_pkey" PRIMARY KEY ("slug","version")
);

-- CreateTable
CREATE TABLE "ratings" (
    "slug" TEXT NOT NULL,
    "discord_user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "has_comment" BOOLEAN NOT NULL DEFAULT false,
    "comment_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("slug","discord_user_id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "author_id" TEXT,
    "author_name" TEXT,
    "author_avatar" TEXT,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supporter_passes" (
    "id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'manual',
    "provider_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "max_devices" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supporter_passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supporter_devices" (
    "pass_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "first_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supporter_devices_pkey" PRIMARY KEY ("pass_id","device_id")
);

-- CreateTable
CREATE TABLE "donation_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "pass_id" TEXT,
    "amount" TEXT,
    "currency" TEXT,
    "donor_email_hash" TEXT,
    "donor_name" TEXT,
    "donor_login" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_events_key_idx" ON "analytics_events"("key");

-- CreateIndex
CREATE INDEX "analytics_events_device_id_idx" ON "analytics_events"("device_id");

-- CreateIndex
CREATE INDEX "analytics_events_slug_idx" ON "analytics_events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_daily_rollups_day_key_slug_key" ON "analytics_daily_rollups"("day", "key", "slug");

-- CreateIndex
CREATE INDEX "device_presences_slug_idx" ON "device_presences"("slug");

-- CreateIndex
CREATE INDEX "presence_active_devices_device_id_idx" ON "presence_active_devices"("device_id");

-- CreateIndex
CREATE INDEX "presence_active_sessions_slug_idx" ON "presence_active_sessions"("slug");

-- CreateIndex
CREATE INDEX "presence_active_sessions_device_id_idx" ON "presence_active_sessions"("device_id");

-- CreateIndex
CREATE INDEX "presence_active_sessions_started_at_idx" ON "presence_active_sessions"("started_at");

-- CreateIndex
CREATE INDEX "presence_versions_slug_idx" ON "presence_versions"("slug");

-- CreateIndex
CREATE INDEX "ratings_slug_idx" ON "ratings"("slug");

-- CreateIndex
CREATE INDEX "comments_slug_idx" ON "comments"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "supporter_passes_code_hash_key" ON "supporter_passes"("code_hash");

-- CreateIndex
CREATE INDEX "supporter_passes_status_idx" ON "supporter_passes"("status");

-- CreateIndex
CREATE INDEX "supporter_devices_device_id_idx" ON "supporter_devices"("device_id");

-- CreateIndex
CREATE INDEX "donation_events_pass_id_idx" ON "donation_events"("pass_id");

-- CreateIndex
CREATE UNIQUE INDEX "donation_events_provider_provider_event_id_key" ON "donation_events"("provider", "provider_event_id");

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("device_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_presences" ADD CONSTRAINT "device_presences_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("device_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presence_active_sessions" ADD CONSTRAINT "presence_active_sessions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("device_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presence_versions" ADD CONSTRAINT "presence_versions_slug_fkey" FOREIGN KEY ("slug") REFERENCES "presences"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supporter_devices" ADD CONSTRAINT "supporter_devices_pass_id_fkey" FOREIGN KEY ("pass_id") REFERENCES "supporter_passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_events" ADD CONSTRAINT "donation_events_pass_id_fkey" FOREIGN KEY ("pass_id") REFERENCES "supporter_passes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
