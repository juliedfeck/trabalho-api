const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // token fica no cabeçalho do http, em authorization
  // busca o token no meio desse texto
  const authHeader = req.headers.authorization;

  // APIs REST envia token no formato de string "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido ou formato inválido.' });
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
    return res.status(401).json({ error: 'Token expirado ou inválido.' });
  }
};

module.exports = authMiddleware;