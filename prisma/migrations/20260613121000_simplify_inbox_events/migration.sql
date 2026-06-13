DROP INDEX `inbox_events_status_idx` ON `inbox_events`;
DROP INDEX `inbox_events_status_processingStartedAt_idx` ON `inbox_events`;

ALTER TABLE `inbox_events`
  DROP COLUMN `status`,
  DROP COLUMN `attempts`,
  DROP COLUMN `error`,
  DROP COLUMN `processingStartedAt`,
  DROP COLUMN `processedAt`,
  DROP COLUMN `failedAt`;
