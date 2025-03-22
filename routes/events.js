import express from 'express';
import { body, validationResult, query, param, check } from 'express-validator';
import { connectToDatabase } from '../db.js';

const db = await connectToDatabase();
const router = express.Router();

// GET

router.get('/', async (req, res) => {
    let podaci_collection = db.collection('events');
    let podaci = await podaci_collection.find().toArray();
  
    res.status(200).json(podaci);
});

// POST

router.post('/', 
    [
        check('start').notEmpty().withMessage('Trebate staviti kada pocinje'),
        check('end').notEmpty().withMessage('Trebate staviti kada zavrsava'),
        check('title').notEmpty().withMessage('Trebate staviti ime eventa'),
        check('class').notEmpty().withMessage('Trebate odabrati boju eventa'),
    ], async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        let podaci_collection = db.collection('events');
        const newEvent = {
            start: req.body.start,
            end: req.body.end,
            title: req.body.title,
            class: req.body.class
        };
        
        const result = await podaci_collection.insertOne(newEvent);
        
        res.status(201).json({
            message: 'Event je uspjesno dodan',
            event: newEvent,
            id: result.insertedId
        });
    } catch (error) {
        res.status(500).json({ message: 'Error u izradi eventa', error: error.message });
    }
});

// DELETE

router.delete('/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        let podaci_collection = db.collection('events');
        
        const { ObjectId } = await import('mongodb');
        const objectId = new ObjectId(eventId);
        
        const result = await podaci_collection.deleteOne({ _id: objectId });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Event nije pronađen' });
        }
        
        res.status(200).json({ 
            message: 'Event je uspješno obrisan',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: 'Error u brisanju eventa', 
            error: error.message 
        });
    }
});

export default router;