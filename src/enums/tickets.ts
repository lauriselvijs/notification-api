export const ticketRoutingKeys = {
  CREATED: "tickets.created",
  UPDATED: "tickets.updated",
  DELETED: "tickets.deleted",
} as const;

export const TicketStatus = {
  OPEN: "open",
  PENDING: "pending",
  CLOSED: "closed",
} as const;
