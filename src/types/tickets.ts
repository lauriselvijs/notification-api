import { ticketRoutingKeys, TicketStatus } from "../enums/tickets.ts";

export type TicketRoutingKey =
  (typeof ticketRoutingKeys)[keyof typeof ticketRoutingKeys];
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;

  createdAt?: Date;
  updatedAt?: Date;
}
