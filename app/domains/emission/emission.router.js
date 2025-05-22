const express = require('express');
const collectionRouter = express.Router();

const collectionController = require('./emission.controller');

collectionRouter.post('/collect', collectionController.collect);
collectionRouter.post('/report', collectionController.report);
collectionRouter.get('/companies', collectionController.companies);
collectionRouter.get('/yearly/:id', collectionController.yearly);
collectionRouter.get('/monthly/:id', collectionController.monthly);
collectionRouter.get('/daily/:id', collectionController.daily);

module.exports = collectionRouter;