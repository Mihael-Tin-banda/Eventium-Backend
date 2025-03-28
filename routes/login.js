import express from 'express';
import { body, validationResult, query, param, check } from 'express-validator';
import { connectToDatabase } from '../db.js';
import { checkPassword, generateJWT } from '../auth.js';

const db = await connectToDatabase();
const router = express.Router();

router.post('/', 
    [
        check('username').notEmpty().withMessage('Trebate staviti username'),
        check('password').notEmpty().withMessage('Trebate staviti password')
    ],async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ username: username });
        
        if (!user) {
            return res.status(400).send('Greška prilikom prijave!');
        }
        
        let result = await checkPassword(password, user.password);
        
        if (!result) {
            return res.status(400).send('Greška prilikom prijave!');
        }
        
        let token = await generateJWT({ 
            id: user._id.toString(),
            username: user.username 
        });
        
        if (!token) {
            throw new Error('Failed to generate token');
        }
        
        res.status(200).json({ jwt_token: token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Server error during authentication');
    }
});

export default router;