const express = require('express')
const router = express.Router()
const commentController = require('../controllers/commentController')
const taskController = require('../controllers/taskController')
const authMiddleware = require('../middlewares/authMiddleware')

/**
 * @swagger
 * tags:
 *   name: Tarefas
 *   description: Gerenciamento de tarefas
 */

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Cria uma nova tarefa
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: Implementar módulo de tarefas
 *               description:
 *                 type: string
 *                 example: Criar model, controller e rotas
 *               status:
 *                 type: string
 *                 example: pending
 *               priority:
 *                 type: string
 *                 example: high
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: 2025-12-31
 *               assignedTo:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Tarefa criada com sucesso
 *       401:
 *         description: Token não fornecido ou inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', authMiddleware, taskController.createTask)

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Lista tarefas com filtros opcionais
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: integer
 *         description: ID do usuário responsável
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Status da tarefa (pending, in_progress, done)
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Prioridade (low, medium, high)
 *       - in: query
 *         name: dueBefore
 *         schema:
 *           type: string
 *           format: date
 *         description: Retorna tarefas com prazo até essa data
 *     responses:
 *       200:
 *         description: Lista de tarefas retornada com sucesso
 *       401:
 *         description: Token não fornecido ou inválido
 */
router.get('/', authMiddleware, taskController.listTasks)

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Busca uma tarefa pelo ID
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da tarefa
 *     responses:
 *       200:
 *         description: Tarefa retornada com sucesso
 *       404:
 *         description: Tarefa não encontrada
 *       401:
 *         description: Token não fornecido ou inválido
 */
router.get('/:id', authMiddleware, taskController.getTask)

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Atualiza uma tarefa
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da tarefa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               priority:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date
 *               assignedTo:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Tarefa atualizada com sucesso
 *       404:
 *         description: Tarefa não encontrada
 *       401:
 *         description: Token não fornecido ou inválido
 */
router.put('/:id', authMiddleware, taskController.updateTask)

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Remove uma tarefa
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da tarefa
 *     responses:
 *       204:
 *         description: Tarefa removida com sucesso
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Tarefa não encontrada
 *       401:
 *         description: Token não fornecido ou inválido
 */
router.delete('/:id', authMiddleware, taskController.deleteTask)

/**
 * @swagger
 * /tasks/{taskId}/comments:
 *   post:
 *     summary: Adiciona um comentário a uma tarefa
 *     tags: [Comentários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da tarefa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: "Já iniciei a pesquisa para esta tarefa!"
 *     responses:
 *       201:
 *         description: Comentário adicionado com sucesso
 *       404:
 *         description: Tarefa não encontrada
 *       500:
 *         description: Erro interno ao adicionar comentário
 */
router.post('/:taskId/comments', authMiddleware, commentController.addComment);

/**
 * @swagger
 * /tasks/{taskId}/comments:
 *   get:
 *     summary: Lista todos os comentários de uma tarefa específica
 *     tags: [Comentários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da tarefa
 *     responses:
 *       200:
 *         description: Lista de comentários retornada com sucesso (ordenada do mais antigo para o mais novo)
 *       500:
 *         description: Erro interno ao buscar comentários
 */
router.get('/:taskId/comments', authMiddleware, commentController.listComments);

/**
 * @swagger
 * /tasks/{taskId}/comments/{commentId}:
 *   delete:
 *     summary: Deleta um comentário específico de uma tarefa
 *     tags: [Comentários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da tarefa
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do comentário
 *     responses:
 *       204:
 *         description: Comentário deletado com sucesso (Sem conteúdo)
 *       403:
 *         description: Acesso negado (Tentativa de deletar comentário de outro usuário)
 *       404:
 *         description: Comentário não encontrado
 *       500:
 *         description: Erro interno ao deletar comentário
 */
router.delete('/:taskId/comments/:commentId', authMiddleware, commentController.deleteComment);

module.exports = router
