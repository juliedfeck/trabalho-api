const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const bcrypt = require('bcrypt');

describe('Testes de Comentários (Fase 5B)', () => {
  let userToken;
  let testUserId;
  let testTaskId;
  let testCommentId; //guarda o ID do comentário criado no teste de POST para usar no teste de DELETE depois

  const testUser = {
    name: 'Comentarista',
    email: 'comentarista@unisinos.br',
    password: 'senha_segura'
  };

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'comentarista@unisinos.br' }
    });

    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    const userCriado = await prisma.user.create({
      data: {
        name: testUser.name,
        email: testUser.email,
        passwordHash: hashedPassword, 
        role: 'admin' //precisamos que o usuario teste seja admin para conseguir testar os POSTs e DELETEs abaixo
      }
    });
    testUserId = userCriado.id;

    const resLogin = await request(app).post('/auth/login').send({
      email: testUser.email,
      password: testUser.password
    });
    userToken = resLogin.body.token;

    const resTask = await request(app) //usa a rota de tarefa que a amanda fez pra criar uma tarefa no banco, pra depois atrelar os comentarios nela, e pegar o ID dessa tarefa criada
      .post('/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Tarefa para testar comentários',
        description: 'Precisamos dessa tarefa no banco para atrelar os comentários nela'
      });
    
    testTaskId = resTask.body.id; // Guardamos o ID da tarefa gerada
  });

  it('Deve adicionar um comentário a uma tarefa e retornar 201', async () => {
    const res = await request(app)
      .post(`/tasks/${testTaskId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        text: 'Este é um comentário de teste automatizado!'
      });
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.text).toBe('Este é um comentário de teste automatizado!');
    
    testCommentId = res.body.id; //guarda o id do comentário criado para usar no teste de exclusão depois
  });

  it('Deve retornar 404 ao tentar comentar em uma tarefa inexistente', async () => {
    const res = await request(app)
      .post('/tasks/999999/comments') // ID 999999 não existe
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        text: 'Comentando no vazio'
      });
    
    expect(res.status).toBe(404);
  });

  it('Deve listar os comentários de uma tarefa específica e retornar 200', async () => {
    const res = await request(app)
      .get(`/tasks/${testTaskId}/comments`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);  //como cria um comentario no teste anterior, o array tem que ter pelo menos um comentario
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('Deve deletar um comentário e retornar 404 ao tentar deletar o mesmo novamente', async () => {
    const resDelete = await request(app) //deleta o comentario
      .delete(`/tasks/${testTaskId}/comments/${testCommentId}`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(resDelete.status).toBe(204);

    const resNotFound = await request(app) //tenta apagar o mesmo comentario que ja foi apagado
      .delete(`/tasks/${testTaskId}/comments/${testCommentId}`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(resNotFound.status).toBe(404);
  });
});