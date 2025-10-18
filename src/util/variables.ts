export const checkEnv = (vars: string[]): void => {
  const missingVars = vars.filter((v) => !process.env[v]);

  if (missingVars.length) {
    throw new Error(`Missing env variables: ${missingVars.join(", ")}`);
  }
};
