const { PrismaClient } = require('../generated/prisma') // importa o prisma
const prisma = new PrismaClient() // cria uma imstancia
module.exports = prisma // exporta p outros usarem

