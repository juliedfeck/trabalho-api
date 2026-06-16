const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const hashPassword = async (password) => {
    // O "salt" é a complexidade da criptografia.
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};


 // Compara a senha digitada no login com o hash criptografado salvo no banco.
const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

const generateToken = (user) => {
    // Payload: os dados úteis que viajam dentro do token.
    const payload = {
        id: user.id,
        role: user.role
    };

    // Sign the token usando o secret
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d', // Puxa do .env OU expira em 1 dia
    });
};

module.exports = {
    hashPassword,
    comparePassword,
    generateToken
};