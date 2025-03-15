import express from 'express';
import { connectToDatabase } from '../db.js';

const db = await connectToDatabase();
const router = express.Router();

router.get('/', async (req, res) => {
    let podaci_collection = db.collection('events');
    let podaci = await podaci_collection.find().toArray();
  
    res.status(200).json(podaci);
});

router.post('/', async (req, res) =>{

});

export default router;