const express = require('express');
const emissionRouter = express.Router();

const emissionController = require('./emission.controller');

emissionRouter.post('/collect', emissionController.collect);
emissionRouter.post('/report', emissionController.report);
emissionRouter.get('/companies', emissionController.companies);
emissionRouter.get('/annual/:id', emissionController.annual);
emissionRouter.get('/monthly/:id', emissionController.monthly);
emissionRouter.get('/daily/:id', emissionController.daily);
emissionRouter.get('/quota', emissionController.quota);
emissionRouter.post('/withdraw', emissionController.withdraw);

module.exports = emissionRouter;