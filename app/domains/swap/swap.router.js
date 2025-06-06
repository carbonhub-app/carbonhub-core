const express = require('express');
const swapRouter = express.Router();

const swapController = require('./swap.controller');

const verifyToken = require('../../middlewares/auth/jwt/jwt.verify');

swapRouter.post('/create', verifyToken, swapController.create);
swapRouter.post('/execute', verifyToken, swapController.execute);
swapRouter.get('/balance', verifyToken, swapController.balance);
swapRouter.get('/price', verifyToken, swapController.price);

module.exports = swapRouter;