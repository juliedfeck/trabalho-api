const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  //usa o "upsert" (update ou insert)
  //porque se o admin já existir, ele não dá erro, apenas ignora.
  const admin = await prisma.user.upsert({
    where: { email: 'admin@unisinos.br' },
    update: {}, //se já existir, não faz nada
    create: {
      name: 'Super Admin',
      email: 'admin@unisinos.br',
      passwordHash: hashedPassword,
      role: 'admin' //define como admin 
    },
  });

  console.log('✅ Banco semeado! Admin criado com sucesso:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });