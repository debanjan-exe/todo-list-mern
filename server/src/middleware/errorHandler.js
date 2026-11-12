// Central error handler. Every error from routes, controllers and services ends here.
// It turns the error into the right HTTP status and a JSON message.
export default function errorHandler(err, req, res, next) {
  // Mongoose schema rule failed (for example, a missing title) -> 400 Bad Request
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  // Unique index broken (for example, the same email twice) -> 409 Conflict
  if (err.code === 11000) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  // Our own errors (NotFoundError, HttpError) and bad JSON bodies have a status
  const status = err.status || 500;
  if (status >= 500) console.error(err); // log only real server errors
  res.status(status).json({ message: status >= 500 ? 'Server error' : err.message });
}
