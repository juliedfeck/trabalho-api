const express = require('express')
const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('./config/swagger')
const errorHandler = require('./middlewares/errorHandler')
const AppError = require('./utils/AppError')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const taskRoutes = require('./routes/taskRoutes')

const app = express()

app.use(express.json())

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/tasks', taskRoutes)

app.use((req, res, next) => {
  next(new AppError(`Rota ${req.method} ${req.url} não encontrada`, 404))
})

app.use(errorHandler)

module.exports = app
