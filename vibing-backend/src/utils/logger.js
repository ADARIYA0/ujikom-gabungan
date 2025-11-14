const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

const { combine, timestamp, errors, printf } = format;

const env = (process.env.NODE_ENV || 'development').trim();
const isProduction = env === 'production';

const fileFormat = combine(
  timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack }) => `[${timestamp}] ${level}: ${stack || message}`)
);

const consoleFormat = combine(
  format.colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`)
);

const warnAndInfoFilter = format((info) => {
  return info.level === 'warn' || info.level === 'info' ? info : false;
});

const consoleLevel = isProduction ? 'info' : 'debug';
const appFileLevel = 'info';
const errorFileLevel = 'error';

const logger = createLogger({
  level: isProduction ? 'info' : 'debug',
  transports: [
    new transports.Console({
      level: consoleLevel,
      format: consoleFormat,
      silent: false,
    }),

    new transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'DD-MM-YYYY',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: appFileLevel,
      format: combine(warnAndInfoFilter(), fileFormat),
    }),

    new transports.File({
      filename: 'logs/error.log',
      level: errorFileLevel,
      format: fileFormat,
      handleExceptions: false,
    }),
  ],

  exceptionHandlers: [
    new transports.File({
      filename: 'logs/exceptions.log',
      format: fileFormat,
    }),
  ],

  rejectionHandlers: [
    new transports.File({
      filename: 'logs/rejections.log',
      format: fileFormat,
    }),
  ],
});

module.exports = logger;
