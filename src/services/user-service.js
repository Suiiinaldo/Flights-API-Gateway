const { UserRepository, RoleRepository } = require("../repositories");
const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/errors/app-error");
const userRepository = new UserRepository();
const roleRepository = new RoleRepository();
const { Auth, Enums } = require("../utils/common");


async function createUser(data){
    try {
        const user = await userRepository.create(data);
        const role = await roleRepository.getRolebyName(Enums.USER_ROLES_ENUMS.CUSTOMER);
        user.addRole(role);
        return user;
    } catch (error) {
        if(error.name == 'SequelizeValidationError' || error.name == 'SequelizeUniqueConstraintError'){
            let explanation = [];
            error.errors.forEach((err) => {
                explanation.push(err.message);
            });
            throw new AppError(explanation,StatusCodes.BAD_REQUEST);
        }
        throw new AppError('Cannot create a new user',StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

async function signin(data){
    console.log("Inside Services");
    try {
        const user = await userRepository.findUser(data.email);
        if(!user){
            throw new AppError("No such user found with this email or username" , StatusCodes.NOT_FOUND);
        }
        const passwordMatch = Auth.passwordCheck(data.password,user.password);
        if(!passwordMatch){
            throw new AppError("Invalid Password",StatusCodes.BAD_REQUEST);
        }
        const jwt = Auth.createToken({id: user.id, email: user.email});
        return jwt;
    } catch (error) {
        if(error instanceof AppError)
        {
            throw error;
        }
        throw new AppError("Something went wrong", StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

async function isAuthenticated(token){
    try {
        if(!token){
            throw new AppError("Missing JWT token", StatusCodes.BAD_REQUEST);
        }
        const reponse = Auth.verifyToken(token);
        const user = await userRepository.get(reponse.id);
        if(!user){
            throw new AppError("No User found", StatusCodes.NOT_FOUND);
        }
        return user.id;
    } catch (error) {
        if(error instanceof AppError) throw error;
        if(error.name == 'JsonWebTokenError'){
            throw new AppError("Invalid JWT token", StatusCodes.BAD_REQUEST);
        }
        if(error.name == 'TokenExpiredError'){
            throw new AppError("JWT token expired", StatusCodes.BAD_REQUEST);
        }
        console.log(error);
        throw new AppError("Something went wrong", StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

async function addRoletoUser(data){
    try {
        const user = await userRepository.get(data.id);
        if(!user){
            throw new AppError("No such user found with the given id" , StatusCodes.NOT_FOUND);
        }
        const role = await roleRepository.getRolebyName(data.role);
        if(!role){
            throw new AppError("No user found for this role" , StatusCodes.NOT_FOUND);
        }
        user.addRole(role);
        return user;
    } catch (error) {
        if(error instanceof AppError) throw error;
        console.log(error);
        throw new AppError("Something went wrong", StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

async function isAdmin(id){
    try {
        const user = await userRepository.get(id);
        if(!user){
            throw new AppError("No such user found with the given id" , StatusCodes.NOT_FOUND);
        }
        const adminrole = await roleRepository.getRolebyName(Enums.USER_ROLES_ENUMS.ADMIN);
        if(!adminrole){
            throw new AppError("No user found for this role" , StatusCodes.NOT_FOUND);
        }
        return user.hasRole(adminrole);
        
    } catch (error) {
        if(error instanceof AppError) throw error;
        console.log(error);
        throw new AppError("Something went wrong", StatusCodes.INTERNAL_SERVER_ERROR);
    }
}



module.exports = {
    createUser,
    signin,
    isAuthenticated,
    addRoletoUser,
    isAdmin,

};