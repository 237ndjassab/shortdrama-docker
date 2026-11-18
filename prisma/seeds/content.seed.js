const { prisma } = require("../../src/model/index.js");
const { faker } = require("@faker-js/faker");

const seedContent = async () => {
  try {
    console.log("🎬 Seeding content...");

    // 🔥 récupérer tous les creators
    const creators = await prisma.utilisateur.findMany({
      where: {
        roles: {
          some: {
            role: {
              roleKey: "CREATOR",
            },
          },
        },
      },
    });

    // 🔥 récupérer catégories
    const categories = await prisma.category.findMany();

    if (!categories.length) {
      throw new Error("Aucune catégorie trouvée");
    }

    for (const creator of creators) {
      // 🎯 2 à 5 séries
      const seriesCount = faker.number.int({ min: 2, max: 5 });

      for (let i = 0; i < seriesCount; i++) {
        const randomCategory =
          categories[Math.floor(Math.random() * categories.length)];

        const series = await prisma.series.create({
          data: {
            title: faker.lorem.words(3) + `_${creator.id}_${i}`,
            description: faker.lorem.paragraph(),
            thumbnail: faker.image.url(),
            language: "FR",
            countryOrigin: creator.country || "Unknown",
            creatorId: creator.id,
            categoryId: randomCategory.id,
            publishedAt: new Date(),
          },
        });

        // 🎯 1 à 3 saisons
        const seasonCount = faker.number.int({ min: 1, max: 3 });

        for (let j = 0; j < seasonCount; j++) {
          const season = await prisma.season.create({
            data: {
              number: j + 1,
              description: faker.lorem.sentence(),
              serieId: series.id,
            },
          });

          // 🎯 5 à 10 épisodes
          const episodeCount = faker.number.int({ min: 5, max: 10 });

          for (let k = 0; k < episodeCount; k++) {
            const isPaid = Math.random() < 0.4; // 40% payant

            await prisma.episode.create({
              data: {
                title: faker.lorem.words(3) + `_${creator.id}_${i}_${j}_${k}`,
                description: faker.lorem.paragraph(),
                videoUrl: faker.internet.url(),
                priceCoins: isPaid
                  ? faker.number.int({ min: 50, max: 300 })
                  : 0,
                isPublished: true,
                creatorId: creator.id,
                seasonId: season.id,
                episodeNumber: k + 1, // 👈 obligatoire pour respecter la contrainte unique
              },
            });
          }
        }
      }
    }

    console.log("✅ Content seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding content:", error);
  }
};

module.exports = { seedContent };
