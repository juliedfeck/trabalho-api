const Comment = require('../models/Comment'); //aqui vai mudar quando a amanda fizer o model, tem que ajustar o caminho pra importar o model do comentário
const prisma = require('../config/prisma'); 
const AppError = require('../utils/AppError');

const addComment = async (req, res, next) => { //a funcao para adicionar um comentario a uma tarefa
    try {
        const { taskId } = req.params; //a rota sera /tasks/:taskId/comments, entao o taskId vem dos params
        const { text } = req.body; //o texto do comentario vem do corpo da requisicao
        
        if (!text || text.trim() === '') {
                return next(new AppError('O campo text é obrigatório.', 400));
        }


        const userId = req.user.id; 

        const taskExists = await prisma.task.findUnique({ //aqui tambem vai mudar quando a amanda fizer o model da task, tem que ajustar pra usar o model da task e nao o prisma direto
            where: { id: parseInt(taskId) } //const taskExists = await Task.findById(taskId);
        });

        if (!taskExists) {
            return next(new AppError('A tarefa informada não existe.', 404))
        }

        const newComment = await Comment.create({ //aqui vai usar o model do comentario pra criar um novo comentario no banco de dados, usando os dados fornecidos
            text: text,
            userId: userId,
            taskId: parseInt(taskId)
        });

        // REQUISITO: "retorna 201"
        return res.status(201).json(newComment);
    } catch (error) {
        next(error)
    }
};

const listComments = async (req, res, next) => { //a funcao para listar os comentarios de uma tarefa, a rota sera /tasks/:taskId/comments, entao o taskId vem dos params
    try {
        const { taskId } = req.params;

        //usa o model pra buscar os comentarios ordenados do mais antigo pro mais novo
        const comments = await Comment.findByTaskId(taskId);

        return res.status(200).json(comments);
    } catch (error) {
        next(error)
    }
};

//deletar comentario
const deleteComment = async (req, res, next) => {
    try {
        //a rota será /tasks/:taskId/comments/:commentId (vamos pegar os dois)
        const { commentId } = req.params;
        const userId = req.user.id; //quem esta tentando apagar

        //verifica se e autor do comentario, se nao for, bloqueia (403) - so pode apagar o proprio comentario
        //mas primeiro tem que verificar se o comentario existe, se nao existir, retorna 404
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return next(new AppError('Comentário não encontrado.', 404))
        }

        if (comment.userId !== userId) {
            return next(new AppError('Acesso negado. Você só pode deletar os seus próprios comentários.', 403))
        }

        await Comment.remove(commentId);

        //retorna 204 No Content, que é o status recomendado para deleção bem sucedida quando não há conteúdo para retornar. O .send() é necessário para finalizar a resposta, mesmo que não haja corpo.
        return res.status(204).send(); 
    } catch (error) {
        next(error)
    }
};

module.exports = {
    addComment,
    listComments,
    deleteComment
};