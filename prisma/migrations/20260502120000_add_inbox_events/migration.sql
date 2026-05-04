CREATE TABLE `inbox_events` (
  `id` VARCHAR(36) NOT NULL,
  `messageId` VARCHAR(255) NOT NULL,
  `exchange` VARCHAR(255) NOT NULL,
  `routingKey` VARCHAR(255) NOT NULL,
  `eventType` VARCHAR(100) NOT NULL,
  `payload` JSON NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'PROCESSING',
  `attempts` INTEGER NOT NULL DEFAULT 1,
  `error` TEXT NULL,
  `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `processedAt` DATETIME(3) NULL,
  `failedAt` DATETIME(3) NULL,

  UNIQUE INDEX `inbox_events_messageId_key`(`messageId`),
  INDEX `inbox_events_status_idx`(`status`),
  INDEX `inbox_events_receivedAt_idx`(`receivedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
