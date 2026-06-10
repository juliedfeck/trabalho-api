const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateCreateUser } = require('../middlewares/validators/userValidator'); 
const authMiddleware = require('../middlewares/authMiddleware'); //ferramenta que o vitor fez pra proteger as rotas

/**
 * @swagger
 * /users:
 * post:
 * summary: Cria um novo usuário
 * tags: [Usuários]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * example:
 * name: "João Silva"
 * email: "joao.silva@email.com"
 * password: "senha_segura123"
 * role: "user"
 * responses:
 * 201:
 * description: Usuário criado com sucesso
 * 400:
 * description: Erro de validação nos dados enviados
 * 409:
 * description: Este e-mail já está em uso
 * 500:
 * description: Erro interno do servidor
 */
// PÚBLICO: Sem o authMiddleware
router.post('/', validateCreateUser, userController.createUser);

/**
 * @swagger
 * /users/{id}:
 * get:
 * summary: Busca um usuário específico pelo ID
 * tags: [Usuários]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * description: ID do usuário
 * responses:
 * 200:
 * description: Usuário retornado com sucesso
 * 404:
 * description: Usuário não encontrado
 * 500:
 * description: Erro ao buscar usuário
 */
// PROTEGIDO: Com authMiddleware
router.get('/:id', authMiddleware, userController.getUser);

/**
 * @swagger
 * /users/{id}:
 * put:
 * summary: Atualiza os dados de um usuário
 * tags: [Usuários]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * description: ID do usuário
 * requestBody:
 * required: true
 * content:
 * application/json:
 * example:
 * name: "João Silva Atualizado"
 * email: "joao.novo@email.com"
 * role: "admin"
 * responses:
 * 200:
 * description: Usuário atualizado com sucesso
 * 403:
 * description: Acesso negado (Tentativa de alterar outro perfil)
 * 500:
 * description: Erro interno do servidor
 */
// PROTEGIDO: Com authMiddleware e validação de dados
router.put('/:id', authMiddleware, validateCreateUser, userController.updateUser);

/**
 * @swagger
 * /users/{id}:
 * delete:
 * summary: Deleta um usuário (Soft Delete)
 * tags: [Usuários]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * description: ID do usuário
 * responses:
 * 204:
 * description: Usuário deletado com sucesso (Sem conteúdo)
 * 500:
 * description: Erro ao deletar usuário
 */
// PROTEGIDO: Com authMiddleware
router.delete('/:id', authMiddleware, userController.deleteUser);

module.exports = router;