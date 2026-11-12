// Errors with an HTTP status code. Services throw them, the error handler sends them.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad request') {
    super(400, message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Please sign in') {
    super(401, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Not allowed') {
    super(403, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not found') {
    super(404, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Already exists') {
    super(409, message);
  }
}
