var comm 	= require('./communication.js'),
	util	= require('util');
    crypto	= require('crypto');
    EventEmitter = require('events').EventEmitter;

function Client(server, port)
{
	this.connection = new comm.Connection(server, port);
	this.responses();
};

Client.prototype.submit = function(name, workload, priority, background)
{
	background = background || false;
	switch(priority)
	{
		case "high":
			type = background ? comm.packets.types.SUBMIT_JOB_HIGH_BG
				: comm.packets.types.SUBMIT_JOB_HIGH;
		case "low":
			type = background ? comm.packets.types.SUBMIT_JOB_LOW_BG
				: comm.packets.types.SUBMIT_JOB_LOW;
		default:
			type = background ? comm.packets.types.SUBMIT_JOB_BG
				: comm.packets.types.SUBMIT_JOB;
	}

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
