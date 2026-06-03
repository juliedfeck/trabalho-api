const request = require('supertest') //simula as requisicoes http
const express = require('express')
const app = require('../src/app')
const errorHandler = require('../src/middlewares/errorHandler')

describe('Servidor', () => {

  it('deve responder na rota /api-docs', async () => {
    const res = await request(app).get('/api-docs/')
    expect(res.status).toBe(200)
  })

  it('deve retornar 404 em JSON para rota inexistente', async () => {
    const res = await request(app).get('/rota-que-nao-existe')
    expect(res.status).toBe(404)
    expect(res.body.status).toBe('error')
    expect(res.body.message).toContain('não encontrada')
  })

  it('deve retornar 500 em JSON para erro interno', async () => {
    const testApp = express()
    testApp.get('/test-error', (req, res, next) => {
      next(new Error('erro inesperado'))
    })
    testApp.use(errorHandler)

    const res = await request(testApp).get('/test-error')
    expect(res.status).toBe(500)
    expect(res.body.status).toBe('error')
    expect(res.body.message).toBe('Erro interno do servidor')
  })

})
