var express = require('express');
var router = express.Router();
var app = express();

var async = require('async');

exports.arrayToObjects = function(Document, array, callback) {
  var calls = [];
  if (array == [] || array === null || typeof array == 'undefined') {
    callback(null, []);
  }
  array.forEach(function(index){
    calls.push(function(response){
      Document.findById(index, function(err, object){
        response(err, object);
      });
    });
  });
  async.series(calls, function(err, objects){
    for (var x = 0; x < objects.length; x ++) {
      if (objects[x] === null) {
        objects.splice(x, 1);
        x --;
      }
    }
    callback(err, objects);
  });
};
