// function to handle async operations in Express routes
// helps to avoid try-catch blocks in every route handler
// Errors are automatically passed to Express's error middleware via next(err).

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
