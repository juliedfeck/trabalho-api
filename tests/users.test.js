const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma'); 
const bcrypt = require('bcrypt'); 

describe('Testes de Usuários (Fase 3)', () => { 
  let userToken; 
  let testUserId; 

  const testUser = { 
    name: 'Usuário Teste Admin',
    email: 'usuarioteste@unisinos.br',
    password: 'senha_segura'
  };

  beforeAll(async () => { 
    await prisma.comment.deleteMany(); 
    await prisma.task.deleteMany();
    await prisma.user.deleteMany(); 

    //criacao direta via Prisma (bypassa a rota para contornar a seguranca de admin)
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
    
    //faz o login normal pra pegar o token do admin criado, e usar esse token nos testes seguintes
    const resLogin = await request(app).post('/auth/login').send({ 
      email: testUser.email,
      password: testUser.password
    });
    userToken = resLogin.body.token;
  });

  it('Deve criar usuário com dados válidos e retornar 201', async () => { 
    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${userToken}`) //agora precisa do token
      .send({
        name: 'Novo Usuário',
        email: 'novo@email.com',
        password: 'senha_segura',
        role: 'user'
      });
    
    expect(res.status).toBe(201); 
    expect(res.body).toHaveProperty('id'); 
  });

  it('Deve retornar 409 ao tentar criar usuário com email duplicado', async () => {
    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${userToken}`) 
      .send({
        name: 'Cópia Usuário',
        email: 'novo@email.com', 
        password: 'senha_segura'
      });
    
    expect(res.status).toBe(409);
  });

  it('Deve retornar 400 ao tentar criar usuário sem nome', async () => {
    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${userToken}`) 
      .send({
        email: 'semnome@email.com',
        password: 'senha_segura'
      });
    
    expect(res.status).toBe(400);
  });

  it('Deve buscar usuário existente e retornar os dados corretos', async () => {
    const res = await request(app)
      .get(`/users/${testUserId}`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(testUserId);
  });

  it('Deve retornar 404 ao buscar um usuário inexistente', async () => {
    const res = await request(app)
      .get('/users/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.status).toBe(404);
  });

  it('Deve atualizar usuário e retornar dados atualizados', async () => {
    const res = await request(app)
      .put(`/users/${testUserId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Nome Atualizado'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Nome Atualizado');
  });

  it('Deve deletar usuário (soft delete), retornar 204, e 404 ao tentar novamente', async () => {
    //apaga o usuário criado no beforeAll usando a rota de delete, que agora exige token e admin
    const resDelete = await request(app)
      .delete(`/users/${testUserId}`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(resDelete.status).toBe(204);

    //tenta apagar novamente, agora deve retornar 404 porque o usuário já foi deletado (soft delete)
    const resNotFound = await request(app)
      .delete(`/users/${testUserId}`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(resNotFound.status).toBe(404);
  });
});