const express = require('express')
const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('./config/swagger')
const errorHandler = require('./middlewares/errorHandler')
const AppError = require('./utils/AppError')

const userRoutes = require('./routes/userRoutes')

const app = express()

app.use(express.json())

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

//rotassss

app.use('/users', userRoutes)

app.use((req, res, next) => { //handler de 404; se chegou aqui, nenhuma rota que tá acima disso deu certo 
  next(new AppError(`Rota ${req.method} ${req.url} não encontrada`, 404))
})

app.use(errorHandler) //registra o error handler criado, é o next do erro 

module.exports = app
