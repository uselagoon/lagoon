import express from 'express';
const router = new express.Router();

const clientPattern = '[a-z0-9\-_]+'; // eslint-disable-line no-useless-escape

import clientController from './fetch';
router.get(`/:client(${clientPattern})`, clientController);

import allClientsController from './fetchAll';
router.get('/', allClientsController);

export default router;
