const validateCreateUser = (req, res, next) => { //next é a função que chama o controller depois de passar pela validação. O req e res são os objetos de requisicao e resposta do Express
    const { name, email, password } = req.body; //desestrutura o nome, email e senha do corpo da requisicao, que é onde o cliente envia os dados para criar um usuario. O req.body é o objeto que contém os dados enviados pelo cliente na requisição HTTP, geralmente em formato JSON.

    //verifica se o nome existe e se nao e um espaco em branco 
    if (!name || name.trim() === '') { //trim() remove os espaços em branco do início e do fim da string, então se o nome for apenas espaços, ele será considerado inválido.
        return res.status(400).json({ erro: "O campo 'name' é obrigatório." }); //verifica se o nome existe, se nao, retorna erro 400
    }

    if (!email || !email.includes('@') || !email.includes('.')) { //verifica se o email existe e se tem @ e . para ser considerado um email válido. Se não, retorna erro 400
        return res.status(400).json({ erro: "Forneça um email válido." });
    }

    if (req.method === 'POST' && (!password || password.length < 6)) { //verifica se a senha existe e se tem pelo menos 6 caracteres. Se for uma requisição POST (criação de usuário) e a senha for inválida, retorna erro 400. Para o PUT (atualização), a senha é opcional, mas se for fornecida, também precisa ter pelo menos 6 caracteres.
        return res.status(400).json({ erro: "A senha é obrigatória e deve ter pelo menos 6 caracteres." });
    }

    //regra para o PUT (Atualização não exige senha, mas se enviar, tem que ter 6 caracteres)
    if (req.method === 'PUT' && password && password.length < 6) {
        return res.status(400).json({ erro: "A nova senha deve ter pelo menos 6 caracteres." });
    }

    //se passar por todos os testes, o next() manda o pedido seguir para o Controller que é onde a lógica de criação ou atualização do usuário vai acontecer. Se alguma das validações falhar, o next() não é chamado e a resposta de erro é enviada imediatamente para o cliente.
    next();
};

module.exports = {
    validateCreateUser
};