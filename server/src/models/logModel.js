const { prisma } = require("../config/database");

const logModel = {
  // Catat aktivitas baru
  // data: { action, userId, details, ipAddress }
  create: async (data) => {
    return await prisma.auditLog.create({ data });
  },
};

module.exports = logModel;
