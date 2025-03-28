import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

console.log('JWT_SECRET loaded:', JWT_SECRET ? 'Yes' : 'No');

async function hashPassword(plainPassword, saltRounds) {
  try {
    const hash = await bcrypt.hash(plainPassword, saltRounds);
    return hash;
  } catch (err) {
    console.error(`Došlo je do greške prilikom hashiranja lozinke: ${err}`);
    return null;
  }
}

async function checkPassword(plainPassword, hashedPassword) {
  try {
    const result = await bcrypt.compare(plainPassword, hashedPassword);
    return result;
  } catch (err) {
    console.error(`Došlo je do greške prilikom usporedbe hash vrijednosti: ${err}`);
    return false;
  }
}

async function generateJWT(payload, expiresIn = '24h') {
  try {
    const secret = JWT_SECRET || 'fallback_secret_for_development';
    console.log('Using secret:', secret ? 'Valid secret' : 'Missing secret');
    
    const token = jwt.sign(payload, secret, { 
      expiresIn,
      algorithm: 'HS256'
    });
    return token;
  } catch (err) {
    console.error(`Došlo je do greške prilikom generiranja JWT tokena: ${err}`);
    return null;
  }
}

async function verifyJWT(token) {
  try {
    const secret = JWT_SECRET || 'fallback_secret_for_development';
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      console.error(`JWT token je istekao: ${err.message}`);
    } else if (err instanceof jwt.JsonWebTokenError) {
      console.error(`Neispravan JWT token: ${err.message}`);
    } else {
      console.error(`Došlo je do greške prilikom verifikacije JWT tokena: ${err}`);
    }
    return null;
  }
}

export { hashPassword, checkPassword, generateJWT, verifyJWT };