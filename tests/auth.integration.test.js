const request = require('supertest'); //simula requisições HTTP para testar os endpoints
const app = require('../src/app');
const prisma = require('../src/config/prisma'); // Prisma para garantir o setup isolado
const bcrypt = require('bcrypt');

describe('Testes de Integração - Autenticação', () => {
    const testUser = {
        name: 'Usuário Auth Integração',
        email: 'auth.integration@teste.com',
        passwordPlain: 'SenhaSegura123!'
    };

    //roda 1x antes do teste começar
    beforeAll(async () => {
        // deleteMany: garante que não há lixo de testes interrompidos anteriormente
        await prisma.user.deleteMany({ where: { email: testUser.email } });

        // cria o usuário diretamente no banco de dados clone
        const hashedPassword = await bcrypt.hash(testUser.passwordPlain, 10);
        await prisma.user.create({
            data: {
                name: testUser.name,
                email: testUser.email,
                passwordHash: hashedPassword,
                role: 'user'
            }
        });
    });

    //roda 1x depois do teste terminar
    afterAll(async () => {
        await prisma.user.deleteMany({ where: { email: testUser.email } });
        
        await prisma.$disconnect(); 
    });


    it('Deve retornar HTTP 401 ao tentar logar com e-mail inexistente no banco', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'email_fantasma_404@teste.com', password: '123' });

        //expect confere o status e o res
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message');
    });

    it('Deve retornar HTTP 401 ao tentar logar com senha incorreta', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: testUser.email, password: 'senha_completamente_errada' });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message');
    });

    it('Deve retornar HTTP 200 e o Token JWT ao logar com credenciais válidas', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: testUser.email, password: testUser.passwordPlain });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token'); // O JWT precisa estar no corpo da resposta
        
        // garantir que o token é uma string não vazia
        expect(typeof res.body.token).toBe('string'); 
    });

    it('Deve retornar HTTP 200 ao fazer logout', async () => {
        const res = await request(app).post('/auth/logout');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Logout realizado com sucesso.');
    });

    it('Deve retornar HTTP 429 ao exceder o limite de tentativas de login (Brute Force)', async () => {
    // dispara 10 req seguidas com a senha errada
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'senha_errada_qualquer'
        });
    }

    // A 11ª req deve ser barrada (429)
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'senha_errada_qualquer'
      });

    expect(response.status).toBe(429);
    expect(response.body.message).toBeDefined();
    // Verifica se a mensagem de erro fala sobre tentativas
    expect(response.body.message).toMatch(/tentativas/i);
  });
});