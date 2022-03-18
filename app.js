const express = require('express');
const path = require('path');
const { getBook } = require('./controllers/getBook');

const app = express();

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/books', async (req, res) => {
  let { genre } = req.query
  try {
    await getBook(genre)
    res.sendStatus(200);
  } catch (error) {
    console.log(error)
    res.status(400).send("an error has occurred, please try again!")
  }
});


app.listen(process.env.PORT || 3000, () => console.log("server is running on port ", process.env.PORT || 3000));