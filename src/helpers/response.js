const ApiReponse = {
  success: (res, message, data, statusCode = 200) => {
    return res.status(statusCode).json({
      meta: {
        status: statusCode,
        message,
      },
      data,
      error: null,
    });
  },
  error: (res, message, data = null, statusCode = 500) => {
    return res.status(statusCode).json({
      meta: {
        status: statusCode,
        message,
      },
      data: null,
      error: data,
    });
  },
  notFound: (res, message, statusCode = 404) => {
    return res.status(statusCode).json({
      meta: {
        status: statusCode,
        message,
      },
      data: null,
      error: null,
    });
  },
};

module.exports = {
  ApiReponse,
};
