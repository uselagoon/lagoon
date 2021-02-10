const express = require('express');
const app = express();
const router = express.Router();
const db = require('./db');
const list = require('./routes/list');

const path = __dirname + '/views/';
const port = process.env.PORT || 3000;

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path));
app.use('/list', list);

app.listen(port, function () {
  console.log(`App listening on ${port}!`);
});