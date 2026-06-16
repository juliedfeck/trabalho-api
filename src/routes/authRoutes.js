const express = require('express');
const authController = require('../controllers/authController');
const loginLimiter = require('../middlewares/loginLimiter');
//router separa as rotas em diferentes arquivos
const router = express.Router();
/**
 * @swagger
 * tags:
 *  name: Autenticação
 *  description: Gerenciamento de acesso e tokens JWT
 */

/**
 * @swagger
 * /auth/login:
 *  post:
 *      summary: Realiza o login do usuário
 *      description: Autentica o usuário validando e-mail e senha. Retorna um Token JWT para uso nas rotas protegidas.
 *      tags: [Autenticação]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      required:
 *                          - email
 *                          - password
 *                      properties:
 *                          email:
 *                              type: string
 *                              format: email
 *                              example: teste@unisinos.br
 *                          password:
 *                              type: string
 *                              format: password
 *                              example: minhasenha 
 *      responses:
 *          200:
 *              description: Login realizado com sucesso.
 *          401:
 *              description: E-mail ou senha incorretos.
 *          500:
 *              description: Erro interno no servidor.
 */
//sempre que alg acessar o /login, vai chamar o auth
//POST pois esconde o corpo da req, mantendo senhas seguras
router.post('/login', loginLimiter, authController.login);

/**
 * @swagger
 * /auth/logout:
 *  post:
 *      summary: Realiza o logout do usuário
 *      description: Apenas retorna uma mensagem de confirmação, pois o controle real do JWT fica no cliente.
 *      tags: [Autenticação]
 *      responses:   
 *          200:
 *              description: Logout realizado com sucesso.
 */
router.post('/logout', authController.logout);

module.exports = router; //avisa para a API usar o router