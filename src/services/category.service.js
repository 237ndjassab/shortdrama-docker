const { prisma } = require("../model/index.js");

class CategoryService {
  static async getAll() {
    return await prisma.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getAllForAdmin() {
    return await prisma.category.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getById(id) {
    const category = await prisma.category.findUnique({
      where: {
        id,
      },
      include: {
        series: {
          where: { isActive: true },
        },
      },
    });
    if (!category) {
      throw new Error("Category not found");
    }
    return category;
  }

  static async create(body) {
    const { name, description, badge, isActive } = body;
    if (!name) {
      throw new Error("name is required");
    }
    return await prisma.category.create({
      data: {
        name,
        description,
        badge,
        isActive: isActive === true || isActive === "true",
      },
    });
  }

  static async update(id, data) {
    return await prisma.category.update({
      where: {
        id,
      },
      data,
    });
  }

  static async delete(id) {
    return await prisma.category.update({
      //soft delete
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });
  }
}
module.exports = { CategoryService };
