const { prisma } = require("../model/index.js");


class SlideService {
  static async create(slideData) {
    return await prisma.slide.create({
      data: {
        title: slideData.title,
        description: slideData.description,

        imageUrl: slideData.imageUrl,
        imagePublicId: slideData.imagePublicId,

        buttonText: slideData.buttonText,
        buttonLink: slideData.buttonLink,

        type: slideData.type,

        serieId: slideData.serieId,
        episodeId: slideData.episodeId,

        order: slideData.order || 0,

        isActive: slideData.isActive !== undefined ? slideData.isActive : true,

        isFeatured: slideData.isFeatured !== undefined ? slideData.isFeatured : false,

        startDate: slideData.startDate,
        endDate: slideData.endDate,
      },

      include: {
        serie: true,
        episode: true,
      },
    });
  }

  static async getAll() {
    const now = new Date();

    return await prisma.slide.findMany({
      where: {
        isActive: true,

        OR: [
          {
            startDate: null,
          },
          {
            startDate: {
              lte: now,
            },
          },
        ],

        AND: [
          {
            OR: [
              {
                endDate: null,
              },
              {
                endDate: {
                  gte: now,
                },
              },
            ],
          },
        ],
      },

      include: {
        serie: true,
        episode: true,
      },

      orderBy: {
        order: "asc",
      },
    });
  }

  static async getAllForAdmin() {
    const now = new Date();

    return await prisma.slide.findMany({
      where: {
        // isActive: true,

        OR: [
          {
            startDate: null,
          },
          {
            startDate: {
              lte: now,
            },
          },
        ],

        AND: [
          {
            OR: [
              {
                endDate: null,
              },
              {
                endDate: {
                  gte: now,
                },
              },
            ],
          },
        ],
      },

      include: {
        serie: true,
        episode: true,
      },

      orderBy: {
        order: "asc",
      },
    });
  }

  static async getOne(id) {
    return await prisma.slide.findUnique({
      where: {
        id,
      },

      include: {
        serie: true,
        episode: true,
      },
    });
  }

  static async update(id, data) {
    return await prisma.slide.update({
      where: {
        id,
      },

      data: {
        title: data.title,
        description: data.description,

        imageUrl: data.imageUrl,
        imagePublicId: data.imagePublicId,

        streamingUrl: data.streamingUrl,

        trailerUrl: data.trailerUrl,
        trailerPublicId: data.trailerPublicId,

        buttonText: data.buttonText,
        buttonLink: data.buttonLink,

        type: data.type,

        serieId: data.serieId,
        episodeId: data.episodeId,

        order: data.order,

        isActive: data.isActive,

        isFeatured: data.isFeatured,

        startDate: data.startDate,
        endDate: data.endDate,
      },

      include: {
        serie: true,
        episode: true,
      },
    });
  }

  static async remove(id) {
    return await prisma.slide.delete({
      where: {
        id,
      },
    });
  }
}

module.exports = SlideService;
