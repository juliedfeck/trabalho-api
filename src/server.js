// o .env é um arquivo de texto simples que guarda as configurações secretas (banco de dados) ou variáveis do ambiente da sua aplicação.
// dotenv é uma biblioteca que lê o arquivo .env e coloca as variáveis dele dentro do process.env do Node.js.
//process.env é um objeto do Node.js que guarda variáveis de ambiente — configurações que podem mudar dependendo de onde o programa roda. Na sua máquina é uma senha, no servidor de produção é outra. O código não muda, só o .env.

//a porta é o canal dentro do localhost que o servidor vai usar
require('dotenv').config() 
const app = require('./app')

const PORT = process.env.PORT || 3000 // lê a porta do env. se a variavel não existir usa 3000

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
}) // sobe o servidor na porta usada

