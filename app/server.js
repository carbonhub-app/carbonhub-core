const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({
    origin: [
        'http://localhost:80',
        'http://localhost:8080',
        'http://localhost:4173',
        'http://localhost:5173',
        'https://carbonhub.app',
        'https://api.carbonhub.app'
    ],
    credentials: true
}));

// const authRouter = require('./domains/auth/auth.router');
// app.use('/auth', authRouter);

const emissionRouter = require('./domains/emission/emission.router');
app.use('/emission', emissionRouter);

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'templates/pages/index.html'));
});

module.exports = app;
