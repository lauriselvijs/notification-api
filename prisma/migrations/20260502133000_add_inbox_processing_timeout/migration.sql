ALTER TABLE `inbox_events`
  ADD COLUMN `processingStartedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

CREATE INDEX `inbox_events_status_processingStartedAt_idx`
  ON `inbox_events`(`status`, `processingStartedAt`);
