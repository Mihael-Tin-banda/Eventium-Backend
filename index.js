import express from 'express';
import EventRouter from './routes/events.js';
import LoginRouter from './routes/login.js';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

app.use('/events', EventRouter);
app.use('/login', LoginRouter);

app.get('/', (req, res) =>{
  	res.send('Spojeno :D');
});



const PORT = 3000;
app.listen(PORT, error => {
  if (error) {
    console.log('Greška prilikom pokretanja poslužitelja', error);
  }
  console.log(`Poslužitelj sluša na http://localhost:${PORT}`);
});
