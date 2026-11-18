const { prisma } = require("../../src/model/index.js");
const { seedBaseUsers } = require("./baseUser.seed.js");

const runSeeds = async () => {
  try {
    await seedBaseUsers();

    console.log("global seeding finished 💕");
  } catch (error) {
    console.error("error :", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

runSeeds();
