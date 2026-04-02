// eslint-disable-next-line @typescript-eslint/no-require-imports
const pinoLib = require('pino');
// Handle both ESM default and CJS export patterns
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pinoFactory = (pinoLib.default ?? pinoLib) as any;

export const logger = pinoFactory({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: { colorize: true },
      }
    : undefined,
});
