const express = require('express');
const collectionRouter = express.Router();

const collectionController = require('./auth.controller');

collectionRouter.post('/request-challenge', collectionController.challenge);
collectionRouter.post('/verify-signature', collectionController.verify);

module.exports = collectionRouter;