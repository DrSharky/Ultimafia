import winston, { format } from 'winston';
import path from 'path';

let logger: winston.Logger | undefined;

const enumerateErrorFormat = format((info: any) => {
  if (info.message instanceof Error) {
    info.message = Object.assign(
      {
        message: info.message.message,
        stack: info.message.stack,
      },
      info.message
    );
  }

  if (info instanceof Error) {
    return Object.assign(
      {
        message: info.message,
        stack: info.stack,
      },
      info
    );
  }
  return info;
});

function createLogger(directory: string): winston.Logger {
    if (!logger) {
        logger = winston.createLogger({
            transports: [
                new winston.transports.File({
                    filename: path.join(__dirname, '../logs', directory, 'error.log'),
                    level: 'error',
                }),
                new winston.transports.File({
                    filename: path.join(__dirname, '../logs', directory, 'warn.log'),
                    level: 'warn',
                }),
                new winston.transports.File({
                    filename: path.join(__dirname, '../logs', directory, 'http.log'),
                    level: 'http',
                }),
            ],
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp(),
                enumerateErrorFormat(),
                winston.format.printf(
                    (info: any) =>
                        `${info.timestamp} ${info.level}: ${info.message} ${info.stack ? `\n${info.stack}` : ''
                        }`
                )
            ),
            exitOnError: false,
        });
        return logger;
    }
}

const stream = {
    write: (message) => {
        logger!.http(message);
    }
}

export default {
    createLogger,
    logger,
    stream
};