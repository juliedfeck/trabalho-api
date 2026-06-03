const swaggerJsdoc = require('swagger-jsdoc')

const options = { // configurações do swagger 
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Trabalho: Engenharia de Software II - API',
      version: '1.0.0',
      description: 'Trabalho da UNISINOS',
    },
    components: { // define coisas reutilizaveis da documentacao
      securitySchemes: { // esquemas de autenticacao usados
        bearerAuth: { // vai ser usado depois pra mostrar que a rota exige autenticação
          type: 'http', //tipo de autenticação
          scheme: 'bearer', // como o token vai ser enviado p header
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
}

module.exports = swaggerJsdoc(options)
