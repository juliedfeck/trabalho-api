
class AppError extends Error { // é um tipo de error (ja vem direto do javascript)
  constructor(message, statusCode) { //message vem do proprio error
    super(message) // super é o construtor da classe pai (Error)
    this.statusCode = statusCode
    this.isOperational = true
  }
}

module.exports = AppError
// em javascript nao precisa obrigatoriamente declarar antes, dá p sair usando ja

//status code guarda o codigo http (404,200,500...)
//isOperational marca erro esperado e nao bug
