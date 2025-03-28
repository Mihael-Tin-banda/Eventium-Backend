import express from 'express';
import { body, validationResult, query, param, check } from 'express-validator';
import { connectToDatabase } from '../db.js';
import { hashPassword } from '../auth.js';

const db = await connectToDatabase();
const router = express.Router();

router.post('/',
    [
        check('username').notEmpty().withMessage('Trebate staviti username'),
        check('password').notEmpty().withMessage('Trebate staviti password')
    ], async (req, res) =>{
    const { username, password } = req.body;

    const usersCollection = db.collection('users');
    const existingUser = await usersCollection.findOne({ username: username });
    
    if (existingUser) {
        return res.status(400).send('Korisničko ime već postoji!');
    }

    let hashedPassword = await hashPassword(password, 10);
    
    const result = await usersCollection.insertOne({ 
        username, 
        password: hashedPassword
    });

    if (result.acknowledged) {
        res.status(201).send('Korisnik je uspješno registriran');
    } else {
        res.status(500).send('Greška prilikom registracije korisnika');
    }
});

export default router;