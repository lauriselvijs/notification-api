export const RABBIT_EXCHANGES = {
  TICKETS: "tickets",
  TICKET_RETRY: "tickets.retry",
  TICKET_DLX: "tickets.dlx",
} as const;

export const RABBIT_QUEUES = {
  TICKET_INTEGRATION: "notification.ticket-integration",
  TICKET_INTEGRATION_RETRY: "notification.ticket-integration.retry",
  TICKET_INTEGRATION_DLQ: "notification.ticket-integration.dlq",
} as const;
