import express from 'express';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../db.js';
import { verifyJWT } from '../auth.js';

const router = express.Router();
const db = await connectToDatabase();

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  const decoded = await verifyJWT(token);
  
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  
  req.user = decoded;
  next();
};

// GET ME

router.get('/me', authenticate, async (req, res) => {
  try {
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.id) });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userData = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      ime: user.ime,
      prezime: user.prezime
    };
    
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;