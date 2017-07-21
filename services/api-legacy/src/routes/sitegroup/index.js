import express from 'express';
const router = new express.Router();

const siteGroupPattern = '[a-z0-9\-_]+'; // eslint-disable-line no-useless-escape

import fetchController from './fetch';
router.get(`/:siteGroup(${siteGroupPattern})`, fetchController);

import createController from './create';
router.post('/', createController);

import updateController from './update';
router.put(`/:siteGroup(${siteGroupPattern})`, updateController);

export default router;
