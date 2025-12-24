const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  // Jika status code masih 200 (default), kita ubah jadi 500 (Internal Server Error)
  // Jika sudah ada status code (misal 400/401 dari controller), kita ikuti itu.
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode);

  res.json({
    status: "error",
    message: err.message,
    // SECURITY: Stack trace hanya muncul di mode development
    // Di production, user tidak boleh melihat jeroan error server
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
