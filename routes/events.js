import express from 'express';
import { body, validationResult, query, param, check } from 'express-validator';
import { connectToDatabase } from '../db.js';
import { verifyJWT } from '../auth.js';

const db = await connectToDatabase();
const router = express.Router();

async function authMiddleware(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
    
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = await verifyJWT(token);

      if (!decoded) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }

      req.user = decoded;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ message: 'Server error during authentication' });
    }
}

// GET

router.get('/', async (req, res) => {
    try {
        const eventsCollection = db.collection('events');
        
        let userId = null;
        if (req.headers.authorization) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = await verifyJWT(token);
                if (decoded) {
                    userId = decoded.id;
                }
            } catch (err) {
            }
        }
        
        let query;
        if (userId) {
            query = { 
                $or: [
                    { type: 'public' },
                    { type: 'private', author: userId }
                ]
            };
        } else {
            query = { type: 'public' };
        }
        
        const events = await eventsCollection.find(query).toArray();
        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Greska u primanju evenata', error: error.message });
    }
});

// GET JOINED

router.get('/joined', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const eventsCollection = db.collection('events');
        
        const joinedEvents = await eventsCollection.find({
            author: userId,
            joined: true
        }).toArray();
        
        res.status(200).json(joinedEvents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: 'Error retrieving joined events', 
            error: error.message 
        });
    }
});

// POST

// Update your POST route to include authMiddleware and fix validation
router.post('/', authMiddleware, [
    check('start').notEmpty().withMessage('Trebate staviti kada pocinje'),
    check('end').notEmpty().withMessage('Trebate staviti kada zavrsava'),
    check('title').notEmpty().withMessage('Trebate staviti ime eventa'),
    check('class').notEmpty().withMessage('Trebate odabrati boju eventa'),
    check('type').notEmpty().isIn(['public', 'private']).withMessage('Trebate odabrati izmedu private ili public')
    // Removed author check as it will come from JWT
], async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        let eventsCollection = db.collection('events');
        const newEvent = {
            start: req.body.start,
            end: req.body.end,
            title: req.body.title,
            class: req.body.class,
            type: req.body.type,
            author: req.user.id,
            authorName: req.user.username,
            // Include description if provided
            description: req.body.description || ""
        };
        
        const result = await eventsCollection.insertOne(newEvent);
        
        res.status(201).json({
            message: 'Event je uspjesno dodan',
            event: newEvent,
            id: result.insertedId
        });
    } catch (error) {
        res.status(500).json({ message: 'Error u izradi eventa', error: error.message });
    }
});

// POST JOIN

router.post('/join/:id', authMiddleware, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;
        const username = req.user.username;
        
        const eventsCollection = db.collection('events');
        
        const { ObjectId } = await import('mongodb');
        const originalEvent = await eventsCollection.findOne({ 
            _id: new ObjectId(eventId),
            type: 'public'
        });
        
        if (!originalEvent) {
            return res.status(404).json({ message: 'Event nije pronaden ili nije public' });
        }
        
        const existingJoin = await eventsCollection.findOne({
            originalEventId: eventId,
            author: userId
        });
        
        if (existingJoin) {
            return res.status(400).json({ message: 'Vec ste se prikljucili eventu' });
        }

        const privateEvent = {
            start: originalEvent.start,
            end: originalEvent.end,
            title: originalEvent.title,
            class: originalEvent.class,
            type: 'private',
            author: userId,
            authorName: username,
            originalEventId: eventId.toString(),
            joined: true,
        };
        
        const result = await eventsCollection.insertOne(privateEvent);
        
        res.status(201).json({
            message: 'Uspjesno ste se prikljucili eventu',
            event: privateEvent,
            id: result.insertedId
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: 'Problem pri ukljucivanju eventu', 
            error: error.message 
        });
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