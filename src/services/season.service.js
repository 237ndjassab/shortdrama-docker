const { prisma } = require("../model/index.js");

class SeasonService {
  static async create({ number, description, serieId, userId }) {
    const serieIdInt = parseInt(serieId);
    const userIdInt = parseInt(userId);

    if (!serieIdInt) throw new Error("Missing serieId field");

    const serie = await prisma.series.findUnique({ where: { id: serieIdInt } });
    if (!serie) throw new Error("Serie not found");
    if (serie.creatorId !== userIdInt) throw new Error("Unauthorized");

    // 🔥 Si number fourni → validation
    if (number) {
      const num = parseInt(number);
      if (!num || num <= 0) throw new Error("Invalid season number");

      if (description) {
        return await prisma.season.create({
          data: { number: num, serieId: serieIdInt, description: description },
        });
      } else {
        return await prisma.season.create({
          data: { number: num, serieId: serieIdInt },
        });
      }
    }

    // 🔥 Sinon → auto-increment par série
    const lastSeason = await prisma.season.findFirst({
      where: { serieId: serieIdInt },
      orderBy: { number: "desc" },
    });

    const nextNumber = lastSeason ? lastSeason.number + 1 : 1;

    if (description) {
      return await prisma.season.create({
        data: {
          number: nextNumber,
          serieId: serieIdInt,
          description: description,
        },
      });
    } else {
      return await prisma.season.create({
        data: {
          number: nextNumber,
          serieId: serieIdInt,
        },
      });
    }
  }

  static async getBySeries({ seriesId, userId }) {
    const id = parseInt(seriesId);
    const userIdInt = parseInt(userId);
    return await prisma.season.findMany({
      where: {
        serieId: id,
        isActive: true,
      },
      include: {
        episodes: true,
      },
      orderBy: {
        number: "asc",
      },
    });
  }

  static async update(id, description, userId) {
    if (!id) throw new Error("Missing serieId field");
    const season = await prisma.season.findFirst({
      where: {
        id: Number(id),
      },
      include: {
        serie: true,
      },
    });
    if (!season) {
      throw new Error("Season not found");
    }
    if (season.serie.creatorId !== userId) {
      throw new Error("Unauthorized");
    }
    return await prisma.season.update({
      where: {
        id,
      },
      data: {
        description: description,
      },
    });
  }

  static async delete(id, userId) {
    const season = await prisma.season.findUnique({
      where: {
        id,
      },
      include: {
        serie: true,
      },
    });
    if (!season) {
      throw new Error("Season not found");
    }
    if (season.serie.creatorId !== userId) {
      throw new Error("Unauthorized");
    }
    return await prisma.season.delete({
      where: { id },
    });
  }
}
module.exports = { SeasonService };
