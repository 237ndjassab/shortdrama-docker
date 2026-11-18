// middleware/responseTime.middleware.js

const responseMetrics = {
  durations: [],
};

const responseTimeMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    responseMetrics.durations.push(duration);

    // On conserve uniquement les 100 dernières requêtes
    if (responseMetrics.durations.length > 100) {
      responseMetrics.durations.shift();
    }

    console.log(
      `[${req.method}] ${req.originalUrl} - ${duration}ms`,
    );
  });

  next();
};

module.exports = {
  responseTimeMiddleware,
  responseMetrics,
};