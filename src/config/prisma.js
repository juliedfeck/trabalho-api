const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient() // cria uma imstancia
module.exports = prisma // exporta p outros usarem

