var nodegears = require('../nodegears.js');

_client = new nodegears.Client();
_client.submit('lowerCase', 'WHAT A GREAT LIBRARY!', "normal", false, function(data){
	console.log(data.toString('utf8'));
});

_worker = new nodegears.Worker();
_worker.register('lowerCase', function(_workload, assign)
{
	assign(_workload.toLowerCase());
});