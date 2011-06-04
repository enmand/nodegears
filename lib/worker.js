comm = require('./communication.js');

function Worker(){};

Worker.prototype = new comm.Connection();

exports.Worker = Worker;
