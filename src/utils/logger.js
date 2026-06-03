const winston = require('winston')

const logger = winston.createLogger({
  level: 'info', // nivel de log que sera gravado
  format: winston.format.combine(
    winston.format.timestamp(), // bota data e hora em cada log
    winston.format.json() // grava os logs em json
  ),
  transports: [ // onde os logs vao 
    new winston.transports.Console(), // vai p terminal 
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }), //grava só erros em um arquivo
    new winston.transports.File({ filename: 'logs/combined.log' }), //grava todos os logs 
  ],
})

module.exports = logger

//log - registro doq ta acontecendo no servidor 