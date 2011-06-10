var comm = require('./communication.js'),
    crypto = require('crypto');

function Client(server, port)
{
	this.connection = new comm.Connection(server, port);
	this.responses();
};

Client.prototype.submit = function(name, workload, priority, background)
{
	uuid = crypto.createHash('sha')
		.update(workload)
		.update(name)
		.update(Math.random().toString())
		.digest('base64');
	_packet = this.connection.build(comm.packets.magic.req,
					comm.packets.types.SUBMIT_JOB,
					-1,
					[name, uuid, workload]
				);
	this.connection.send(_packet);
}

Client.prototype.responses = function()
{

}

exports.Client = Client;
