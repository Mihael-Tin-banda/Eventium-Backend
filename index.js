import express from 'express';
import EventRouter from './routes/events.js';

const app = express();
app.use(express.json());

app.use('/events', EventRouter);

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
