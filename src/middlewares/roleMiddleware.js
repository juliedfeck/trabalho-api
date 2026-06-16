const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    // passou pelo authMiddleware?
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado: privilégios insuficientes.' });
    }

    next();
  };
};

const isAdmin = (req, res, next) => {
  //verifica se o usuário está autenticado, se não estiver, bloqueia (401)
  if (!req.user) {
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  //verifica se o usuario tem o papel de admin, se nao tiver, bloqueia (403)
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
  }

  next();
};

module.exports = { roleMiddleware, isAdmin };