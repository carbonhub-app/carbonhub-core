const express = require('express');
const collectionRouter = express.Router();

const collectionController = require('./auth.controller');
const verifyToken = require('../../middlewares/auth/jwt/jwt.verify');

collectionRouter.post('/request-challenge', collectionController.challenge);
collectionRouter.post('/verify-signature', collectionController.verify);
collectionRouter.get('/status', verifyToken, collectionController.status);

module.exports = collectionRouter;