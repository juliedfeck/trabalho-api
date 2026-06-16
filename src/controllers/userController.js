const User = require('../models/User'); 
const { hashPassword } = require('../utils/auth'); //importa a parte do vitor
const AppError = require('../utils/AppError');

const createUser = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        //verificar se email existe com User.findByEmail()
        const userExists = await User.findByEmail(email);
        if (userExists) {
            return next(new AppError('Este e-mail já está em uso', 409)) //se existir um usuário com o email fornecido, retorna erro 409 (conflito)
        }

        //criptografar senha com hashPassword()
        const hashedPassword = await hashPassword(password);

        //chamar User.create()
        const newUser = await User.create({
            name: name,
            email: email,
            passwordHash: hashedPassword,
            role: role || "user" //se o role não for fornecido, assume "user" como padrão
        });

        delete newUser.passwordHash; //por segurança, remove o passwordHash do objeto que será retornado para o cliente

        return res.status(201).json(newUser);  //retorna o usuário criado com status 201 (created)
    } catch (error) {
        next(error)
    }
};

//funcao getUser
const getUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Chamar User.findById(req.params.id) -> 404 se não achar
        const user = await User.findById(id);
        if (!user) {
            return next(new AppError('Usuário não encontrado', 404))
        }

        //retornar dados sem passwordHash
        delete user.passwordHash;

        return res.status(200).json(user);
    } catch (error) {
        next(error)

    }
};

//funcao updateUser
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, role, password } = req.body;

        //verificar se req.user.id === req.params.id -> 403
        //essa parte ja tem que ta no codigo da pessoa 2
        //eu so faco a verificacao
        if (req.user.id !== parseInt(id)) {
            return next(new AppError('Acesso negado. Você só pode alterar seu próprio perfil.', 403))
        }

        const updateData = { 
            name: name, 
            email: email 
        };

        if (role && req.user.role === 'admin') {
            const allowedRoles = ['user', 'admin']; //define os cargos permitidos para atualização, garantindo que apenas "user" e "admin" sejam aceitos como valores válidos para o campo role. Isso ajuda a manter a integridade dos dados e evita que cargos inválidos sejam atribuídos aos usuários.
            
            if (!allowedRoles.includes(role)) {
                return next(new AppError('Cargo inválido. Os cargos permitidos são apenas: user ou admin.', 400));
            }
            
            updateData.role = role;
        }

        if (password) {
            const hashedPassword = await hashPassword(password); //se o usuario mandou uma nova senha, tem que criptografar ela antes de atualizar no banco de dados, entao chama a funcao hashPassword() pra isso
            updateData.passwordHash = hashedPassword;
        }

        const updatedUser = await User.update(id, updateData);

        if (updatedUser.passwordHash) {
            delete updatedUser.passwordHash; 
        }

        return res.status(200).json(updatedUser); 
    } catch (error) {
        next(error)
    }
};

//funcao pra deletar o usuario sem deletar de verdade, ou seja, soft delete
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
    
        const user = await User.findById(id); //primeiro verifica se o usuário existe, se não existir, retorna 404

        //se o usuário não existir ou já tiver sido deletado (soft delete), retorna 404.
        if (!user || user.deletedAt !== null) {
            return next(new AppError('Usuário não encontrado ou já deletado.', 404));
        }


        //chamar User.softDelete(req.params.id)
        await User.softDelete(id);

        //retorna 204
        return res.status(204).send(); 
    } catch (error) {
        next(error)
    }
};

module.exports = { 
    createUser,
    getUser,
    updateUser,
    deleteUser
};