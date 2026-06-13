const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma'); // Importando o prisma para fazer a limpeza da Amanda

describe('Testes de Usuários (Fase 3)', () => { //describe agrupa os testes relacionados a usuários
  let userToken; //testes usam o token de usuario e o id do usuario criado para realizar as operações de leitura e exclusão
  let testUserId; //variáveis para armazenar o token e o ID do usuário criado durante os testes, permitindo que sejam reutilizados em diferentes casos de teste, como buscar ou deletar o usuário criado.

  const testUser = { //dados usuario teste
    name: 'Usuário Teste',
    email: 'cobaia@unisinos.br',
    password: 'senha_segura'
  };

  beforeAll(async () => { //beforeAll é uma função do Jest que é executada uma vez antes de todos os testes dentro do describe. Aqui, ela é usada para configurar o ambiente de teste, como limpar o banco de dados e criar um usuário de teste para ser usado nos casos de teste subsequentes.
    await prisma.comment.deleteMany(); //limpeza de banco que nem a amanda fez  
    await prisma.task.deleteMany();
    await prisma.user.deleteMany(); 

    const resCreate = await request(app).post('/users').send(testUser); //manda pela rota de criacao de usuario pra nao ter que usar o bycrypt aqui no teste, e ja testa a rota de criacao de usuario
    testUserId = resCreate.body.id; //armazena o ID do usuário criado para usar nos testes de busca e exclusão
    
    const resLogin = await request(app).post('/auth/login').send({ //usa a rota que o vitor fez pra pegar o token do usuario criado, que vai ser usado nos testes de busca e exclusao
      email: testUser.email,
      password: testUser.password
    });
    userToken = resLogin.body.token;
  });

  it('Deve criar usuário com dados válidos e retornar 201', async () => { //it e a função do Jest que define um caso de teste individual. Aqui, o teste verifica se a criacao de um usuario com dados validos retorna um status HTTP 201 (Created) e se o corpo da resposta contem a propriedade 'id', indicando que o usuario foi criado com sucesso.
    const res = await request(app)
      .post('/users')
      .send({
        name: 'Novo Usuário',
        email: 'novo@email.com',
        password: 'senha_segura',
        role: 'user'
      });
    
    expect(res.status).toBe(201); //verifica se o status da resposta é 201 (Created)
    expect(res.body).toHaveProperty('id'); //verifica se o corpo da resposta tem a propriedade 'id', indicando que o usuário foi criado com sucesso
  });

  it('Deve retornar 409 ao tentar criar usuário com email duplicado', async () => {
    const res = await request(app)
      .post('/users')
      .send({
        name: 'Cópia Usuário',
        email: 'novo@email.com', //usando o mesmo do teste anterior
        password: 'senha_segura'
      });
    
    expect(res.status).toBe(409);
  });

  it('Deve retornar 400 ao tentar criar usuário sem nome', async () => {
    const res = await request(app)
      .post('/users')
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

  it('Deve deletar usuário (soft delete) e retornar 204', async () => {
    const res = await request(app)
      .delete(`/users/${testUserId}`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.status).toBe(204);
  });
});