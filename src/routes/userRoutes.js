const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateCreateUser } = require('../middlewares/validators/userValidator');

const verifyToken = require('../middlewares/authMiddleware'); 
const { roleMiddleware } = require('../middlewares/roleMiddleware');

/**
 * @swagger
 * tags:
 *   name: Usuários
 *   description: Gerenciamento de usuários
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Cria um novo usuário (Apenas admin)
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 example: joao.silva@email.com
 *               password:
 *                 type: string
 *                 example: senha_segura123
 *               role:
 *                 type: string
 *                 example: user
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Erro de validação nos dados enviados
 *       409:
 *         description: Este e-mail já está em uso
 *       500:
 *         description: Erro interno do servidor
 */
//rota blindada: Requer Token -> Requer ser Admin -> Valida os dados -> Cria o usuário
router.post('/', verifyToken, roleMiddleware(['admin']), validateCreateUser, userController.createUser);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Busca um usuário específico pelo ID
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário retornado com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro ao buscar usuário
 */
//rota protegida (apenas logados)
router.get('/:id', verifyToken, userController.getUser);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Atualiza os dados de um usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: João Silva Atualizado
 *               email:
 *                 type: string
 *                 example: joao.novo@email.com
 *               role:
 *                 type: string
 *                 example: admin
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       403:
 *         description: Acesso negado (Tentativa de alterar outro perfil)
 *       500:
 *         description: Erro interno do servidor
 */
//rota protegida (apenas logados)
router.put('/:id', verifyToken, validateCreateUser, userController.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Deleta um usuário (Soft Delete - apenas admin)
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       204:
 *         description: Usuário deletado com sucesso (Sem conteúdo)
 *       500:
 *         description: Erro ao deletar usuário
 */
//rota blindada: Requer Token -> Requer ser Admin -> Deleta o usuário
router.delete('/:id', verifyToken, roleMiddleware(['admin']), userController.deleteUser);

module.exports = router;
