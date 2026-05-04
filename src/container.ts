import { HandleTicketIntegrationEventUseCase } from "./application/use-cases/HandleTicketIntegrationEventUseCase.ts";
import { InboxEventRepository } from "./infrastructure/database/repositories/InboxEventRepository.ts";
import { PrismaNotificationRepository } from "./infrastructure/database/repositories/PrismaNotificationRepository.ts";

export const handleTicketIntegrationEventUseCase =
  new HandleTicketIntegrationEventUseCase(new PrismaNotificationRepository());

export const inboxEventRepository = new InboxEventRepository();
