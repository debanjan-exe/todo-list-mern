// Express 4 does not catch errors from async functions.
// This wrapper sends any error to next(err), so the central error handler gets it.
// Result: controllers need no try/catch.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
