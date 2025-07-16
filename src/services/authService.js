const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const jwtConfig = require('../config/jwt');

class AuthService {

    // Hacher un mot de passe
    static async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }

    // Vérifier un mot de passe
    static async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    // Générer un token JWT
    static generateToken(payload) {
        return jwt.sign(payload, jwtConfig.secret, {
            expiresIn: jwtConfig.expiresIn,
            ...jwtConfig.signOptions
        });
    }

    // Vérifier un token JWT
    static verifyToken(token) {
        try {
            return jwt.verify(token, jwtConfig.secret, jwtConfig.verifyOptions);
        } catch (error) {
            throw new Error('Token invalide');
        }
    }

    // Générer un token de vérification email
    static generateEmailVerificationToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Créer un utilisateur
    static async registerUser(userData) {
        const { name, email, password, role = 'membre' } = userData;

        // Vérifier si l'email existe déjà
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            throw new Error('Un utilisateur avec cet email existe déjà');
        }

        // Hacher le mot de passe
        const hashedPassword = await this.hashPassword(password);

        // Générer le token de vérification
        const emailVerificationToken = this.generateEmailVerificationToken();
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        // Créer l'utilisateur
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            is_email_verified: false,
            email_verification_token: emailVerificationToken,
            email_verification_expires: emailVerificationExpires
        });

        // Retourner l'utilisateur sans le mot de passe
        const userResponse = user.toJSON();
        delete userResponse.password;

        return {
            user: userResponse,
            emailVerificationToken
        };
    }

    // Authentifier un utilisateur
    static async loginUser(email, password) {
        // Trouver l'utilisateur
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new Error('Email ou mot de passe incorrect');
        }

        // Vérifier le mot de passe
        const isValidPassword = await this.verifyPassword(password, user.password);
        if (!isValidPassword) {
            throw new Error('Email ou mot de passe incorrect');
        }

        // Vérifier si l'email est vérifié
        if (!user.is_email_verified) {
            throw new Error('Veuillez vérifier votre email avant de vous connecter');
        }

        // Générer le token JWT
        const token = this.generateToken({
            id: user.id,
            email: user.email,
            role: user.role
        });

        // Retourner l'utilisateur sans le mot de passe
        const userResponse = user.toJSON();
        delete userResponse.password;
        delete userResponse.email_verification_token;

        return {
            user: userResponse,
            token
        };
    }

    // Vérifier l'email
    static async verifyEmail(token) {
        const user = await User.findOne({
            where: {
                email_verification_token: token,
                email_verification_expires: {
                    [require('sequelize').Op.gt]: new Date()
                }
            }
        });

        if (!user) {
            throw new Error('Token de vérification invalide ou expiré');
        }

        // Marquer l'email comme vérifié
        await user.update({
            is_email_verified: true,
            email_verification_token: null,
            email_verification_expires: null
        });

        return user;
    }

    // Renvoyer un email de vérification
    static async resendVerificationEmail(email) {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        if (user.is_email_verified) {
            throw new Error('Email déjà vérifié');
        }

        // Générer un nouveau token
        const emailVerificationToken = this.generateEmailVerificationToken();
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await user.update({
            email_verification_token: emailVerificationToken,
            email_verification_expires: emailVerificationExpires
        });

        return {
            user,
            emailVerificationToken
        };
    }
}

module.exports = AuthService;