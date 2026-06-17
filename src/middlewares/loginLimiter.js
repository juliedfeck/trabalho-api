const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Tempo de bloqueio: 15 minutos
  max: process.env.NODE_ENV === 'test' ? 10 : 5, // Limite de tentativas: 10 nos testes, 5 em produção
  message: { 
    message: 'Tentativas de login excedidas. Por favor, tente novamente após 15 minutos.' 
  },
  standardHeaders: true, // Retorna os headers de rate limit no padrão da W3C
  legacyHeaders: false, // Desabilita os headers antigos (X-RateLimit-*)
});

module.exports = loginLimiter;