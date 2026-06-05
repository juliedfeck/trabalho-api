const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    // passou pelo authMiddleware?
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado: privilégios insuficientes.' });
    }

    next();
  };
};

module.exports = roleMiddleware;