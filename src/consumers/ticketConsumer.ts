import { ticketRoutingKeys } from "../enums/tickets.ts";
import type { Ticket, TicketRoutingKey } from "../types/tickets.ts";

const ticketConsumerHandler = async (
  key: TicketRoutingKey,
  payload: Ticket
) => {
  const ticketRoutingKey = {
    [ticketRoutingKeys.CREATED]: () => console.log("Ticket Created:", payload),
    [ticketRoutingKeys.UPDATED]: () => console.log("Ticket Updated:", payload),
    [ticketRoutingKeys.DELETED]: () => console.log("Ticket Deleted:", payload),
  };

  while (ticketRoutingKey[key]) {
    return ticketRoutingKey[key]();
  }
};

export { ticketConsumerHandler };
