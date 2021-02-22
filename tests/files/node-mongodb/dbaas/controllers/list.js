const path = require('path');
const List = require('../models/list');

exports.index = function (req, res) {
    res.sendFile(path.resolve('views/list.html'));
};

exports.create = function (req, res) {
    var newItem = new List(req.body);
    console.log(req.body);
    newItem.save(function (err) {
            if(err) {
            res.status(400).send('Unable to save item to database');
        } else {
            res.redirect('/list/getlist');
        }
  });
               };

exports.list = function (req, res) {
        List.find({}).exec(function (err, items) {
                if (err) {
                        return res.send(500, err);
                }
                res.render('getlist', {
                        items: items
             });
        });
};