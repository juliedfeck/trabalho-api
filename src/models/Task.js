const prisma = require('../config/prisma')

const Task = {
    create: async (data) => {
        return await prisma.task.create({
            data: data
        })
    },

    findById: async (id) => {
        return await prisma.task.findUnique({
            where: {
                id: parseInt(id)
            }
        })
    },

    update: async (id, data) => {
        return await prisma.task.update({
            where: { id: parseInt(id) },
            data: data
        })
    },

    remove: async (id) => {
        return await prisma.task.delete({
            where: { id: parseInt(id) }
        })
    },

    findWithFilters: async (filters) => {
        return await prisma.task.findMany({
            where: { ...filters }
        })
    }
}

module.exports = Task