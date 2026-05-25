/*
  Warnings:

  - You are about to drop the `ticket_activity` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `ticket_activity` DROP FOREIGN KEY `ticket_activity_ticketId_fkey`;

-- DropForeignKey
ALTER TABLE `ticket_activity` DROP FOREIGN KEY `ticket_activity_userId_fkey`;

-- AlterTable
ALTER TABLE `tickets` ADD COLUMN `closedById` VARCHAR(191) NULL,
    ADD COLUMN `resolutionNotes` TEXT NULL,
    ADD COLUMN `resolvedById` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `ticket_activity`;

-- CreateTable
CREATE TABLE `ticket_history` (
    `id` VARCHAR(191) NOT NULL,
    `ticketId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `field` VARCHAR(191) NOT NULL,
    `oldValue` VARCHAR(191) NULL,
    `newValue` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ticket_history_ticketId_idx`(`ticketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_resolvedById_fkey` FOREIGN KEY (`resolvedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_closedById_fkey` FOREIGN KEY (`closedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_history` ADD CONSTRAINT `ticket_history_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_history` ADD CONSTRAINT `ticket_history_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
