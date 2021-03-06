import { Request, Response } from 'express';
import userModel, { User } from '../models/user.model';
import gameModel from '../models/game.model';
import { env } from '../config/config';
import jwt from 'jsonwebtoken';
import { validationResult } from "express-validator";

class UserController {

    //Iniciar sesión y generar token
    public async login(req: Request, res: Response): Promise<void> {
        try {
            const error = validationResult(req);
            if (error.isEmpty()) {
                const { uemail, upass } = req.body;
                await userModel.findOne({ uemail: { $regex: uemail } })
                    .then(async (user) => {
                        if (user) {
                            const equals = await user.comparePassword(upass);
                            if (equals) {
                                const token = jwt.sign({ id: user._id }, env.mysecret, {
                                    expiresIn: env.expiresIn
                                });
                                res.json({ auth: true, token });

                            } else {
                                res.json({
                                    auth: false,
                                    msg: 'El correo o el usuario es incorrecto'
                                });
                            }
                        } else {
                            res.json({ auth: false, msg: 'Usuario no encontrado' });
                        }
                    })
                    .catch((e) => {
                        console.log(e);
                        res.status(500).send('Error obeniendo el usuario');
                    });
            } else {
                res.json({
                    errorRegex: error
                });
            }
        } catch (e) {
            console.log(e);
            res.status(500).send('Problemas autenticando este usuario');
        }
    }
    //Registrar usuario y generar token
    public async register(req: Request, res: Response): Promise<void> {
        try {
            const error = validationResult(req);
            if (error.isEmpty()) {
                const { uname, uemail, upass, uage } = req.body;
                const user: User = new userModel({
                    uname,
                    uemail,
                    upass,
                    uage
                });
                user.upass = await user.encryptPassword(upass);
                const us = await user.save();
                if (us) {
                    const token = jwt.sign({ id: user._id }, env.mysecret, {
                        expiresIn: env.expiresIn
                    });
                    res.json({ auth: true, token });
                } 
            }else {
                res.json({ errorRegex: error });
            }
        } catch (e) {
            console.log(e);
            res.status(500).send('Problemas registrando el usuario');
        }
    }

    //Información del usuario
    public async getUser(req: Request, res: Response): Promise<void> {
        try {
            const user = await userModel.findById(req.body.uid);
            if (user) {
                res.json({
                    user
                });
            }
        } catch (e) {
            console.log(e);
            res.status(500).send('Error obteniendo el usuario');
        }

    }

    //Ver todos usuarios (nombre, email)
    public async getUsers(req: Request, res: Response): Promise<void> {
        try {
            const listUsers: User[] = await userModel.find();
            let users: any[] = [];
            for (let x of listUsers) {
                const user = {
                    uname: x.uname,
                    uemail: x.uemail
                }
                users.push(user);
            }
            res.json({ users });
        } catch (e) {
            console.log(e);
            res.status(500).send('Error obteniendo los usuarios');
        }
    }
    //Actualizar usuario
    public async updateUser(req: Request, res: Response): Promise<void> {
        try {
            const _id = req.body.uid;
            const { uname, uemail, upass, uage } = req.body;
            let userUpdate: User = new userModel({
                _id,
                uname,
                uemail,
                upass,
                uage
            });
            userUpdate.upass = await userUpdate.encryptPassword(req.body.upass);
            const userUp = await userModel.findByIdAndUpdate(req.body.uid, userUpdate, { new: true });
            if (userUp) {
                res.json({
                    message: "Usuario actualizado con éxito",
                    user: userUp
                });
            }
        } catch (e) {
            console.log(e);
            res.status(500).send('Error actualizando el usuario');
        }
    }

    //Eliminar usuario (tambien se eliminan sus juegos)
    public async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const user = await userModel.findByIdAndDelete(req.body.uid);
            if (user) {
                await gameModel.deleteMany({ uid: { $regex: user._id } });
            }
            res.json({
                message: "Este usuario fue eliminado con éxito",
            });
        } catch (e) {
            console.log(e);
            res.status(500).send('Error eliminando el usuario');
        }
    }

    //Eliminar Todos los usuarios
    public async deleteUsers(req: Request, res: Response): Promise<void> {
        try {
            await userModel.deleteMany({});
            res.json({
                message: "Usuarios eliminados con éxito",
            });
        } catch (e) {
            console.log(e);
            res.status(500).send('Error eliminando los usuarios');
        }
    }
}

const userController = new UserController();
export default userController;