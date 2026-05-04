const {
  MYSQL_ROOT_PASSWORD,
  MYSQL_DATABASE,
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_USER,
} = process.env;

if (
  !MYSQL_ROOT_PASSWORD ||
  !MYSQL_DATABASE ||
  !MYSQL_HOST ||
  !MYSQL_PORT ||
  !MYSQL_USER
) {
  throw new Error("Missing required MySQL environment variables");
}

export const databaseConfig = {
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  user: MYSQL_USER,
  pass: MYSQL_ROOT_PASSWORD,
  database: MYSQL_DATABASE,
  url: `mysql://${MYSQL_USER}:${encodeURIComponent(MYSQL_ROOT_PASSWORD)}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}`,
};
