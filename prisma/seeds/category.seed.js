const { prisma } = require("../../src/model/index.js");

const categoriesSeed = [
  {
    name: "Action",
    description: "Contenus riches en action et adrénaline",
    badge: "🔥",
  },
  {
    name: "Romance",
    description: "Histoires d'amour et relations",
    badge: "❤️",
  },
  {
    name: "Comédie",
    description: "Contenus humoristiques et divertissants",
    badge: "😂",
  },
  {
    name: "Drame",
    description: "Histoires profondes et émotionnelles",
    badge: "🎭",
  },
  {
    name: "Science-Fiction",
    description: "Univers futuristes et technologies avancées",
    badge: "🚀",
  },
  {
    name: "Horreur",
    description: "Contenus effrayants et suspense",
    badge: "👻",
  },
  {
    name: "Documentaire",
    description: "Contenus éducatifs et informatifs",
    badge: "🎬",
  },
  {
    name: "Animation",
    description: "Dessins animés et contenus animés",
    badge: "🎨",
  },
  {
    name: "Fantastique",
    description: "Magie, mondes imaginaires et créatures",
    badge: "🧙‍♂️",
  },
  {
    name: "Thriller",
    description: "Suspense intense et intrigues",
    badge: "🔪",
  },
];

const seedCategories = async () => {
  try {
    console.log("📂 Seeding categories...");

    for (const category of categoriesSeed) {
      await prisma.category.upsert({
        where: {
          name: category.name,
        },
        update: {
          description: category.description,
          badge: category.badge,
          isActive: true,
        },
        create: {
          name: category.name,
          description: category.description,
          badge: category.badge,
          isActive: true,
        },
      });
    }

    console.log("✅ Categories seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
  }
};

module.exports = { seedCategories };