const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

const { comparePassword, generateToken } = require('../utils/auth');

//Endpoint de Login (POST /auth/login)
const login = async (req, res, next) => {
    try {
        // pega variáveis da requisição
        const { email, password } = req.body;

        // prisma procura o email no BD
        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        if (!user) {
            return next(new AppError('E-mail ou senha incorretos', 401))
        }

        const isPasswordValid = await comparePassword(password, user.passwordHash);

        if (!isPasswordValid) {
            return next(new AppError('E-mail ou senha incorretos', 401))
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
        next(error)
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