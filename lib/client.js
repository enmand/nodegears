var comm = require('./communication.js'),
    crypto = require('crypto');


function Client()
{
	this.responses();
};
Client.prototype = new comm.Connection();

Client.prototype.submit = function(name, workload, priority, background)
{
	uuid = crypto.createHash('sha')
		.update(workload)
		.update(name)
		.update(Math.random().toString())
		.digest('base64');
	_packet = this.build(comm.packets.magic.req,
				comm.packets.types.SUBMIT_JOB,
				-1,
				[name, uuid, workload]
			);
	this.send(_packet);
}

Client.prototype.responses = function()
{

}

exports.Client = Client;
