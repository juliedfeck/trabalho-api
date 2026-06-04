const Comment = require('../models/Comment'); //aqui vai mudar quando a amanda fizer o model, tem que ajustar o caminho pra importar o model do comentário
const prisma = require('../config/prisma'); 

const addComment = async (req, res) => { //a funcao para adicionar um comentario a uma tarefa
    try {
        const { taskId } = req.params; //a rota sera /tasks/:taskId/comments, entao o taskId vem dos params
        const { text } = req.body; //o texto do comentario vem do corpo da requisicao
        
        const userId = req.user.id; 

        const taskExists = await prisma.task.findUnique({ //aqui tambem vai mudar quando a amanda fizer o model da task, tem que ajustar pra usar o model da task e nao o prisma direto
            where: { id: parseInt(taskId) } //const taskExists = await Task.findById(taskId);
        });

        if (!taskExists) {
            return res.status(404).json({ erro: "A tarefa informada não existe." });
        }

        const newComment = await Comment.create({ //aqui vai usar o model do comentario pra criar um novo comentario no banco de dados, usando os dados fornecidos
            text: text,
            userId: userId,
            taskId: parseInt(taskId)
        });

        // REQUISITO: "retorna 201"
        return res.status(201).json(newComment);
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ erro: "Erro ao adicionar comentário" });
    }
};

const listComments = async (req, res) => { //a funcao para listar os comentarios de uma tarefa, a rota sera /tasks/:taskId/comments, entao o taskId vem dos params
    try {
        const { taskId } = req.params;

        //usa o model pra buscar os comentarios ordenados do mais antigo pro mais novo
        const comments = await Comment.findByTaskId(taskId);

        return res.status(200).json(comments);
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ erro: "Erro ao buscar comentários" });
    }
};

//deletar comentario
const deleteComment = async (req, res) => {
    try {
        //a rota será /tasks/:taskId/comments/:commentId (vamos pegar os dois)
        const { commentId } = req.params;
        const userId = req.user.id; //quem esta tentando apagar

        //verifica se e autor do comentario, se nao for, bloqueia (403) - so pode apagar o proprio comentario
        //mas primeiro tem que verificar se o comentario existe, se nao existir, retorna 404
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ erro: "Comentário não encontrado." });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({ erro: "Acesso negado. Você só pode deletar os seus próprios comentários." });
        }

        await Comment.remove(commentId);

        //retorna 204 No Content, que é o status recomendado para deleção bem sucedida quando não há conteúdo para retornar. O .send() é necessário para finalizar a resposta, mesmo que não haja corpo.
        return res.status(204).send(); 
    } catch (error) {
        console.error(error);
        return res.status(500).json({ erro: "Erro interno ao deletar comentário." });
    }
};

module.exports = {
    addComment,
    listComments,
    deleteComment
};