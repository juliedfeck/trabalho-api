const { PrismaClient } = require('@prisma/client');
const prisma = require('../config/prisma');

const { comparePassword, generateToken } = require('../utils/auth');

//Endpoint de Login (POST /auth/login)
const login = async (req, res) => {
    try {
        // pega variáveis da requisição
        const { email, password } = req.body;

        // prisma procura o email no BD
        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        if (!user) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos' });
        }

        const isPasswordValid = await comparePassword(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos' });
        }

        // Gera Token JWT para o usuário
        const token = generateToken(user);

        return res.status(200).json({
            message: 'Login realizado com sucesso!',
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};


//Endpoint de Logout (POST /auth/logout)
const logout = (req, res) => {
    // Como APIs REST com JWT são "stateless" (não guardam sessão na memória),
    // o logout verdadeiro acontece no Frontend, quando o aplicativo apaga o token.
    // Para a API, basta retornarmos uma mensagem de sucesso confirmando a ação.
    return res.status(200).json({ message: 'Logout realizado com sucesso.' });
};

module.exports = {
    login,
    logout
};