const express = require("express");
const { usersRouter } = require("./users.router.js");
const { categoriesRouter } = require("./categories.router.js");
const { rolesRouter } = require("./role.router.js");
const { permissionsRouter } = require("./permissions.router.js");
const { authRouter } = require("./auth.router.js");
const { walletRouter } = require("./wallet.router.js");
const { EpisodeRouter } = require("./episode.router.js");
const { purchaseRouter } = require("./purchase.router.js");
const { adminRouter } = require("./admin.router.js");
const { coinRouter } = require("./coins.router.js");
const { serieRouter } = require("./serie.router.js");
const { seasonRouter } = require("./season.router.js");
const { likeRouter } = require("./like.router.js");
const { creatorRouter } = require("./creator.router.js");
const { favoriteRouter } = require("./favorite.router.js");
const { slideRouter } = require("./slide.router.js");
const { testRouter } = require("./test.router.js");
const { paymentRouter } = require("./payment.router.js");
const { notificationRouter } = require("./notification.router.js");
const router = express.Router();

// deja gerer
router.use("/users", usersRouter);
// deja gerer
router.use("/creator", creatorRouter);

router.use("/categories", categoriesRouter);

router.use("/roles", rolesRouter);
router.use("/permissions", permissionsRouter);

// deja gerer
router.use("/auth", authRouter);
// deja gerer

// deja gerer
router.use("/wallet", walletRouter);
// deja gerer

//** a reverifier pour y inserer le creatorProfile et le creatorStats */
router.use("/episodes", EpisodeRouter);

//** a reverifier pour y inserer le creatorProfile et le creatorStats */
router.use("/purchase", purchaseRouter);

//** */
router.use("/admin", adminRouter);

// deja gerer
router.use("/coin", coinRouter);
// deja gerer

router.use("/favorites", favoriteRouter);

router.use("/serie", serieRouter);

router.use("/season", seasonRouter);

router.use("/like", likeRouter);

router.use("/slide", slideRouter);

router.use("/campay-test", testRouter);
router.use("/payments", paymentRouter);
router.use("/notifications", notificationRouter);

module.exports = {
  router,
};
