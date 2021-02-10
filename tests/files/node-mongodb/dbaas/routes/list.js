const express = require('express');
const router = express.Router();
const list = require('../controllers/list');

router.get('/', function(req, res){
    list.index(req,res);
});

router.post('/additem', function(req, res) {
    list.create(req,res);
});

router.get('/getlist', function(req, res) {
    list.list(req,res);
});

module.exports = router;