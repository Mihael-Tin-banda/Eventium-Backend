import express from 'express';
import { body, validationResult, query, param, check } from 'express-validator';
import { connectToDatabase } from '../db.js';
import { hashPassword } from '../auth.js';

const db = await connectToDatabase();
const router = express.Router();

router.post('/',
    [
        check('ime').notEmpty().withMessage('Trebate staviti ime'),
        check('prezime').notEmpty().withMessage('Trebate staviti prezime'),
        check('email').notEmpty().isEmail().withMessage('Trebate staviti email'),
        check('username').notEmpty().withMessage('Trebate staviti username'),
        check('password').notEmpty().withMessage('Trebate staviti password')
    ], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { ime, prezime, email, username, password } = req.body;

        const usersCollection = db.collection('users');
        const existingUser = await usersCollection.findOne({ 
            $or: [
                { username: username },
                { email: email }
            ]
        });
        
        if (existingUser) {
            if (existingUser.username === username && existingUser.email === email) {
                return res.status(400).send('Korisničko ime i email već postoji!');
            } else if (existingUser.username === username) {
                return res.status(400).send('Korisničko ime već postoji!');
            } else {
                return res.status(400).send('Email već postoji!');
            }
        }

        let hashedPassword = await hashPassword(password, 10);
        if (!hashedPassword) {
            return res.status(500).send('Greška prilikom obrade lozinke');
        }
        
        const result = await usersCollection.insertOne({ 
            ime,
            prezime,
            email,
            username, 
            password: hashedPassword
        });

        if (result.acknowledged) {
            res.status(201).send('Korisnik je uspješno registriran');
        } else {
            res.status(500).send('Greška prilikom registracije korisnika');
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).send('Server error during registration');
    }
});

export default router;