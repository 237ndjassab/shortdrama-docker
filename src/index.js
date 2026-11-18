const express = require("express");
const morgan = require("morgan");
const { router } = require("./router/index.js");
const { errorHandle } = require("./middleware/error.middleware.js");
const { env } = require("./config/env.js");
const path = require("node:path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { responseTimeMiddleware } = require("./middleware/responseTime.middleware.js");

const app = express();

app.use(
  cors({
    origin: "*",
  }),
);
app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.json());
app.use(responseTimeMiddleware);
app.use(express.static(path.join(__dirname, "../public")));
app.use("/api", router);
app.use(errorHandle);

app.listen(env.port, env.host, (err) => {
  if (err) {
    console.log("Error:", err);

    throw new Error(
      `Failed to start a server at http://${env.host}:${env.port}`,
    );
  }

  console.log(
    `Our application ${env.appname} is running on http://${env.host}:${env.port}`,
  );
});
