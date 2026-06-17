const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma'); 
const bcrypt = require('bcrypt'); 

describe('Testes de Usuários (Fase 3)', () => { 
  let userToken; 
  let testUserId; 
  let normalUserId; //variável para armazenar o ID do usuário normal criado no beforeAll, para usar nos testes de acesso negado

  const testUser = { 
    name: 'Usuário Teste Admin',
    email: 'usuarioteste@unisinos.br',
    password: 'senha_segura'
  };

  beforeAll(async () => { 
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['usuarioteste@unisinos.br', 'novo@email.com', 'joao.teste', 'fraca@email.com'] //email sem @, email com senha fraca
        }
      }
    });

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
    normalUserId = res.body.id; //armazena o ID do usuário normal criado para usar nos testes de acesso negado
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

  it('Deve retornar 400 se tentar criar usuário com email inválido', async () => { //teste para validar a regra de que o email deve ser válido, ou seja, conter @ e ., para ser considerado um email válido. Essa validação já existe no código, então o teste é para garantir que ela está funcionando corretamente.
    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${userToken}`) 
      .send({
        name: 'Email Errado',
        email: 'joao.teste', 
        password: 'senha_segura'
      });
    
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Forneça um email válido.'); 
  });

  it('Deve retornar 400 se tentar criar usuário com senha menor que 6 caracteres', async () => { //teste para validar a regra de que a senha deve ter pelo menos 6 caracteres. Essa validação já existe no código, então o teste é para garantir que ela está funcionando corretamente.
    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${userToken}`) 
      .send({
        name: 'Senha Fraca',
        email: 'fraca@email.com',
        password: '123' 
      });
    
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('A senha é obrigatória e deve ter pelo menos 6 caracteres.'); 
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
      .get('/users/999999')
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

  it('Deve retornar 400 se tentar atualizar o nome apenas com espaços em branco', async () => { //teste para validar a regra de que o nome não pode ser vazio ou apenas espaços em branco, tanto no POST quanto no PUT. No caso do PUT, o nome é opcional, mas se for fornecido, não pode ser vazio.
    const res = await request(app)
      .put(`/users/${testUserId}`)
      .set('Authorization', `Bearer ${userToken}`) 
      .send({
        name: '    ' 
      });
    
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("O campo 'name' não pode ser apenas espaços em branco."); 
  });

  it('Deve ignorar a tentativa de um usuário comum se autopromover a admin via PUT', async () => {
    //daz login com o usuário comum que foi criado ali em cima no primeiro teste
    const resNormalLogin = await request(app).post('/auth/login').send({
      email: 'novo@email.com',
      password: 'senha_segura'
    });
    const normalUserToken = resNormalLogin.body.token;

    //o usuário comum tenta atualizar o próprio perfil mandando "role": "admin"
    const resUpdate = await request(app)
      .put(`/users/${normalUserId}`)
      .set('Authorization', `Bearer ${normalUserToken}`)
      .send({
        name: 'Nome Alterado Pelo Usuário',
        role: 'admin' //tentativa de se autopromover a admin, o sistema deve ignorar essa mudança de role e deixar como "user"
      });
    
    //valida se o controlador aceitou a mudança de nome, mas ignorou totalmente a mudança de cargo
    expect(resUpdate.status).toBe(200);
    expect(resUpdate.body.name).toBe('Nome Alterado Pelo Usuário');
    expect(resUpdate.body.role).toBe('user'); //passou, continua como user, a tentativa de se autopromover a admin foi ignorada com sucesso
    expect(resUpdate.body.role).not.toBe('admin');
  });

  it('Deve retornar 400 se o admin tentar atualizar um usuário com uma role inválida', async () => {
    //o admin tenta atualizar um usuário mandando um cargo que não existe na lista permitida
    const resInvalidRole = await request(app)
      .put(`/users/${testUserId}`) //podemos usar a conta comum como teste
      .set('Authorization', `Bearer ${userToken}`) //usamos o token do ADMIN
      .send({
        role: 'batata' //tentativa de inserir lixo no banco
      });
    
    //valida se a API barrou o lixo e devolveu o erro 400 (Bad Request)
    expect(resInvalidRole.status).toBe(400);
    expect(resInvalidRole.body.message).toBe('Cargo inválido. Os cargos permitidos são apenas: user ou admin.');
  });

  it('Deve retornar 403 se um usuário comum tentar acessar uma rota de admin', async () => {
    //fazemos login com o usuário comum salvo (ex: novo@email.com criado no início do teste)
    const resNormalLogin = await request(app).post('/auth/login').send({
      email: 'novo@email.com',
      password: 'senha_segura'
    });
    const tokenComum = resNormalLogin.body.token;

    //o usuário comum tenta apagar o Admin (rota protegida pelo roleMiddleware)
    const resAcessoNegado = await request(app)
      .delete(`/users/${testUserId}`) 
      .set('Authorization', `Bearer ${tokenComum}`); //usa o token do usuário comum
    
    expect(resAcessoNegado.status).toBe(403);
    expect(resAcessoNegado.body.message).toBe('Acesso negado: privilégios insuficientes.');
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