const {
  RABBIT_HOST,
  RABBIT_PORT,
  RABBITMQ_DEFAULT_USER,
  RABBITMQ_DEFAULT_PASS,
} = process.env;

if (
  !RABBIT_HOST ||
  !RABBIT_PORT ||
  !RABBITMQ_DEFAULT_USER ||
  !RABBITMQ_DEFAULT_PASS
) {
  throw new Error("Missing required RabbitMQ environment variables");
}

export const rabbitConfig = {
  host: RABBIT_HOST,
  port: RABBIT_PORT,
  user: RABBITMQ_DEFAULT_USER,
  pass: RABBITMQ_DEFAULT_PASS,
  url: `amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@${RABBIT_HOST}:${RABBIT_PORT}`,
};
