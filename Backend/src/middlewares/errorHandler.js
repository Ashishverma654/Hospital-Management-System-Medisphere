import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== "production";

  logger.error(err.message, {
    stack: err.stack,
    statusCode,
    path: req?.path,
    method: req?.method,
  });

  let message = err.message;
  if (statusCode === 500 && !isDev) {
    message = "Internal server error";
  }

  const payload = {
    success: false,
    message,
  };
  if (isDev && err.stack) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};

export default errorHandler;