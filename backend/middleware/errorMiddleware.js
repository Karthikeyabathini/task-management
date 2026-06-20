const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Mongoose validation error
  let message = err.message;
  let errors = {};

  if (err.name === 'ValidationError') {
    message = 'Validation Error';
    Object.keys(err.errors).forEach((key) => {
      errors[key] = err.errors[key].message;
    });
  }

  // Mongoose duplicate key error (e.g. email already exists)
  if (err.code === 11000) {
    message = 'Duplicate field value entered';
    const field = Object.keys(err.keyValue)[0];
    errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    res.status(400);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };
