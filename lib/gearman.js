var Worker	= require('./worker.js').Worker,
    Client 	= require('./client.js').Client,
    Connection	= require('./communication.js').Connection;

_worker = new Worker();
_worker.register('do_something', function(_workload){return "test";});

_client = new Client();
_client.submit('do_something', 'WORKING!');
