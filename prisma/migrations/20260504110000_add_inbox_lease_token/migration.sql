ALTER TABLE `inbox_events`
  ADD COLUMN `leaseToken` VARCHAR(36) NULL AFTER `status`;
