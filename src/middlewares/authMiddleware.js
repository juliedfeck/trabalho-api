const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const authMiddleware = (req, res, next) => {
  // token fica no cabeçalho do http, em authorization
  // busca o token no meio desse texto
  const authHeader = req.headers.authorization;

  // APIs REST envia token no formato de string "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Token não fornecido ou formato inválido.', 401));
  }

  // separa a palavra "Bearer" do token
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; //vincula a req com o user

    // passa pro controller (ou outro middleware)
    next();
  } catch (error) {
    // se o token for fake
    return next(new AppError('Token expirado ou inválido.', 401));
  }
};

module.exports = authMiddleware;