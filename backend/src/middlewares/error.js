export function notFound(req, res, next) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = err.message || "Server error";
  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }
  res.status(status).json({
    message,
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
}
