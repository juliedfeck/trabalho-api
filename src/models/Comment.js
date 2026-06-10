const prisma = require('../config/prisma'); // Importa a conexao com o banco (ajuste o caminho se necessário)

//create(data) -> prisma.comment.create()
const create = async (data) => { //chama o prisma para criar um novo comentario na tabela de comentarios do banco de dados, usando os dados fornecidos como argumento. O data deve ser um objeto contendo as informacoes necessarias para criar o comentario, como texto, userId e taskId.
    return await prisma.comment.create({
        data: data
    });
};

//findByTaskId(taskId) -> prisma.comment.findMany() incluindo nome do autor
const findByTaskId = async (taskId) => { //usa o prisma para buscar todos os comentarios relacionados a uma tarefa especifica, identificada pelo taskId. A funcao retorna uma lista de comentarios que pertencem a tarefa, incluindo o nome do autor de cada comentario, usando a relação definida no Prisma entre as tabelas de comentarios e usuarios.
    return await prisma.comment.findMany({
        where: { 
            taskId: parseInt(taskId) 
        },
        orderBy: {
            createdAt: 'asc' //ordena do mais antigo pro mais novo
        },
        include: {
            user: { 
                select: {
                    name: true
                }
            }
        }
    });
};

//findById(id) -> prisma.comment.findUnique()
const findById = async (id) => { //usa o prisma para buscar um comentario especifico pelo seu id, usando a funcao findUnique. A funcao retorna o comentario correspondente ao id fornecido, ou null se nenhum comentario for encontrado com esse id.
    return await prisma.comment.findUnique({
        where: { 
            id: parseInt(id) 
        }
    });
};

//remove(id) -> prisma.comment.delete()
const remove = async (id) => { //usa o prisma para deletar um comentario especifico pelo seu id, usando a funcao delete. A funcao remove o comentario correspondente ao id fornecido do banco de dados e retorna o comentario deletado. Se nenhum comentario for encontrado com esse id, a funcao pode lançar um erro ou retornar null, dependendo da implementacao do Prisma.
    return await prisma.comment.delete({
        where: { 
            id: parseInt(id) 
        }
    });
};

module.exports = {
    create,
    findByTaskId,
    findById,
    remove
};