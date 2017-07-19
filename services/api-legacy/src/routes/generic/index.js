import express from 'express';
const router = new express.Router();

// Load route controllers into the router.
import statusController from './status';
router.get('/status', statusController);

// Redirect GET requests on "/" to the status route.
router.get('/', (request, response) => response.redirect('/status'));

export default router;
