const request = require('supertest'); //simula requisições HTTP para testar os endpoints
const app = require('../src/app'); 
const User = require('../src/models/User'); 
const bcrypt = require('bcrypt');

// MOCK simula comportamento real, porém é fake
//jest roda o código e avalia o comportamento
jest.mock('../src/models/User', () => ({
    findByEmail: jest.fn()
}));

describe('Testes Unitários de Autenticação', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Deve retornar HTTP 401 ao tentar logar com e-mail inexistente', async () => {
        User.findByEmail.mockResolvedValue(null);

        const res = await request(app) //gera a req fake
            .post('/auth/login')
            .send({ email: 'vitor@teste.com', password: 'senha123' });

        expect(res.status).toBe(401);
    });

    it('Deve retornar HTTP 401 ao tentar logar com senha incorreta', async () => {
        const fakeHash = await bcrypt.hash('senha_correta', 10);
        
        User.findByEmail.mockResolvedValue({
            id: 1,
            name: 'Usuário Teste',
            email: 'vitor@teste.com',
            passwordHash: fakeHash,
            role: 'user'
        });

        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'vitor@teste.com', password: 'senha_errada' });

        expect(res.status).toBe(401);
    });

    it('Deve retornar HTTP 200 e o Token JWT ao logar com credenciais corretas', async () => {
        const passwordCorrect = 'senha_correta';
        const fakeHash = await bcrypt.hash(passwordCorrect, 10);
        
        User.findByEmail.mockResolvedValue({
            id: 1,
            name: 'Usuário Teste',
            email: 'vitor@teste.com',
            passwordHash: fakeHash,
            role: 'user'
        });

        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'vitor@teste.com', password: passwordCorrect });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('Deve retornar HTTP 200 ao fazer logout', async () => {
        const res = await request(app).post('/auth/logout');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Logout realizado com sucesso.');
    });

    it('Deve retornar HTTP 429 ao estourar o limite de tentativas (Brute Force)', async () => {
        const fakeHash = await bcrypt.hash('senha_correta', 10);
        
        // Mocka o usuário para o teste não quebrar se bater no controller
        User.findByEmail.mockResolvedValue({
            id: 1,
            name: 'Usuário Teste',
            email: 'vitor@teste.com',
            passwordHash: fakeHash,
            role: 'user'
        });

        for (let i = 0; i < 10; i++) {
            await request(app)
                .post('/auth/login')
                .send({ email: 'vitor@teste.com', password: 'senha_errada_qualquer' });
        }

        // A 11ª requisição deve retornar 429
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'vitor@teste.com', password: 'senha_errada_qualquer' });

        expect(res.status).toBe(429);
        expect(res.body.error).toMatch(/tentativas/i);
    });
});