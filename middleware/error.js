export const globalErrorHandler = (err, req, res, next) => {
  console.log(err);
  if (err.status === 400) {
    return res.status(err.status).json({
      message: err.message,
    });
  }

  if (err.status === 404) {
    return res.status(err.status).json({
      message: err.message,
    });
  } else {
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
