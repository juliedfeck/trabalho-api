const prisma = require('../config/prisma');

const User = {
    //create (Criar um usuário)
    create: async (data) => {
        return await prisma.user.create({
            data: data
        });
    },

    //encontrar pelo ID, filtrando apenas os usuários que não foram deletados (deletedAt: null)
    findById: async (id) => {
        return await prisma.user.findFirst({
            where: { 
                id: parseInt(id),
                deletedAt: null
            }
        });
    },

    //encontrar pelo email
    findByEmail: async (email) => {
        return await prisma.user.findFirst({ //usa findFirst para buscar o primeiro usuário que corresponda ao email fornecido, garantindo que a conta não tenha sido excluída (deletedAt: null)    
            where: {
                email : email, 
                deletedAt: null //garante que a conta nao foi excluida
            }
        });
    },

    //update, atualizar um usuario existente
    update: async (id, data) => {
        return await prisma.user.update({
            where: { id: parseInt(id) },
            data: data
        });
    },

    //softDelete(id) - seta deletedAt: new Date()
    softDelete: async (id) => {
        return await prisma.user.update({
            where: { id: parseInt(id) },
            data: { 
                deletedAt: new Date() //preenche a coluna deletedAt com a data atual, indicando que o usuário foi deletado, mas sem remover o registro do banco de dados
            }
        });
    }
};

module.exports = User;