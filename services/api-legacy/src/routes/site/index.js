import express from 'express';
const router = new express.Router();

// Regex patterns for validating route paramters.
const siteHostPattern = '[a-z0-9\-_]+\.[a-z0-9\-_]+'; // eslint-disable-line no-useless-escape
const siteNamePattern = '[a-z0-9\-_]+'; // eslint-disable-line no-useless-escape

// Load route controllers into the router.
import fetchController from './fetch';
router.get(`/:siteHost(${siteHostPattern})/:siteName(${siteNamePattern})`, fetchController);

import createController from './create';
router.post(`/:siteHost(${siteHostPattern})`, createController);

import updateController from './update';
router.put(`/:siteHost(${siteHostPattern})/:siteName(${siteNamePattern})`, updateController);

export default router;
