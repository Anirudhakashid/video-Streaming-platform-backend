// function to handle async operations in Express routes
// helps to avoid try-catch blocks in every route handler
// Errors are automatically passed to Express's error middleware via next(err).
//In Express.js, if an async function throws an error or a promise rejects, the error won’t automatically get passed to the next() function, and your app might crash or hang silently.

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
