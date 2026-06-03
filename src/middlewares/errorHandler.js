const logger = require('../utils/logger')

const errorHandler = (err, req, res, next) => {
    //err - erro que foi lançado em algum lugar
    //req - requisicao que chegou
    //res - a resposta que sera enviasa
    //next - o proximo lugar dps da conclusao
  logger.error(err.message) // grava o erro recebido no log

  if (err.isOperational) { // se for um erro operacional (lançado de propósito) ele vai lançar a mensagem q eu defini quando fiz o erro 
    //erro lançado de propósito - algo invalido, senha errada...
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    })
  }

  return res.status(500).json({ //se for um erro nao operacional/bug vai sair esse aqui com erro 500 e mensagem generica
    status: 'error',
    message: 'Erro interno do servidor',
  })
}

module.exports = errorHandler

//middleware - fica entre a requisição e o destino, uma etapa extra no meio
//esse middleware captura todos os erros em um lugar só. sem isso aqui, cada rota teria que tratar seus próprios erros individualmente
