// Roda antes de qualquer teste — troca o banco para o banco de testes
require('dotenv').config()
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
