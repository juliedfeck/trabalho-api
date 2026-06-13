const request = require('supertest')
const app = require('../src/app')
const prisma = require('../src/config/prisma')
const { hashPassword } = require('../src/utils/auth')

// dados reutilizados nos testes
const testUser = {
  name: 'Usuário Teste',
  email: 'teste.tasks@unisinos.br',
  password: 'senha123',
}

let token
let userId

// roda uma vez antes de todos os testes
beforeAll(async () => {
  // limpa dados de testes anteriores
  await prisma.comment.deleteMany()
  await prisma.task.deleteMany()
  await prisma.user.deleteMany({ where: { email: testUser.email } })

  // cria usuário e faz login para pegar o token
  const passwordHash = await hashPassword(testUser.password)
  const user = await prisma.user.create({
    data: { name: testUser.name, email: testUser.email, passwordHash }
  })
  userId = user.id

  const loginRes = await request(app)
    .post('/auth/login')
    .send({ email: testUser.email, password: testUser.password })

  token = loginRes.body.token
})

// limpa as tarefas depois de cada teste para não interferir no próximo
afterEach(async () => {
  await prisma.comment.deleteMany()
  await prisma.task.deleteMany()
  await prisma.user.deleteMany({ where: { email: 'outro@unisinos.br' } })
})

// limpa tudo no final
afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testUser.email } })
  await prisma.$disconnect()
})

describe('POST /tasks', () => {
  it('deve criar uma tarefa com sucesso', async () => {
    const res = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tarefa de teste', priority: 'high' })

    expect(res.status).toBe(201)
    expect(res.body.title).toBe('Tarefa de teste')
    expect(res.body.createdBy).toBe(userId)
  })

  it('deve retornar 401 sem token', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Tarefa sem token' })

    expect(res.status).toBe(401)
  })
})

describe('GET /tasks/:id', () => {
  it('deve retornar uma tarefa existente', async () => {
    const task = await prisma.task.create({
      data: { title: 'Tarefa buscada', createdBy: userId }
    })

    const res = await request(app)
      .get(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(task.id)
  })

  it('deve retornar 404 para tarefa inexistente', async () => {
    const res = await request(app)
      .get('/tasks/999999')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })
})

describe('GET /tasks', () => {
  it('deve listar tarefas filtradas por status', async () => {
    await prisma.task.createMany({
      data: [
        { title: 'Tarefa pendente', status: 'pending', createdBy: userId },
        { title: 'Tarefa concluída', status: 'done', createdBy: userId },
      ]
    })

    const res = await request(app)
      .get('/tasks?status=pending')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.length).toBe(1)
    expect(res.body[0].status).toBe('pending')
  })

  it('deve listar todas as tarefas sem filtro', async () => {
    await prisma.task.createMany({
      data: [
        { title: 'Tarefa 1', createdBy: userId },
        { title: 'Tarefa 2', createdBy: userId },
      ]
    })

    const res = await request(app)
      .get('/tasks')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.length).toBe(2)
  })
})

describe('PUT /tasks/:id', () => {
  it('deve atualizar uma tarefa com sucesso', async () => {
    const task = await prisma.task.create({
      data: { title: 'Tarefa original', createdBy: userId }
    })

    const res = await request(app)
      .put(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tarefa atualizada', status: 'done' })

    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Tarefa atualizada')
    expect(res.body.status).toBe('done')
  })

  it('deve retornar 404 para tarefa inexistente', async () => {
    const res = await request(app)
      .put('/tasks/999999')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Título novo' })

    expect(res.status).toBe(404)
  })
})

describe('DELETE /tasks/:id', () => {
  it('deve deletar a própria tarefa com sucesso', async () => {
    const task = await prisma.task.create({
      data: { title: 'Tarefa a deletar', createdBy: userId }
    })

    const res = await request(app)
      .delete(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(204)
  })

  it('deve retornar 404 para tarefa inexistente', async () => {
    const res = await request(app)
      .delete('/tasks/999999')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })

  it('deve retornar 403 ao tentar deletar tarefa de outro usuário', async () => {
    // cria outro usuário e uma tarefa pertencente a ele
    const outroUser = await prisma.user.create({
      data: { name: 'Outro', email: 'outro@unisinos.br', passwordHash: 'hash' }
    })
    const task = await prisma.task.create({
      data: { title: 'Tarefa do outro', createdBy: outroUser.id }
    })

    const res = await request(app)
      .delete(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)

    await prisma.user.delete({ where: { id: outroUser.id } })
  })
})
