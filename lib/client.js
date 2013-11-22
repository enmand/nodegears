var comm	= require('./communication.js'),
	util	= require('util'),
    crypto	= require('crypto'),
    EventEmitter = require('events').EventEmitter;

function Client(server, port)
{
	this.connection = new comm.Connection(server, port);
	this.responses();
}

util.inherits(Client, EventEmitter);

Client.prototype.submit = function(name, workload, priority, _background,
									callback)
{
	// Register the call back for work
	this.once('response', function(_data){
		callback(_data);
	});

	var background = _background || false;
	var type;

	switch(priority)
	{
		case "high":
			type = background ? comm.packets.types.SUBMIT_JOB_HIGH_BG
				: comm.packets.types.SUBMIT_JOB_HIGH;
			break;
		case "low":
			type = background ? comm.packets.types.SUBMIT_JOB_LOW_BG
				: comm.packets.types.SUBMIT_JOB_LOW;
			break;
		default:
			type = background ? comm.packets.types.SUBMIT_JOB_BG
				: comm.packets.types.SUBMIT_JOB;
	}

	var uuid = crypto.createHash('sha')
		.update(workload)
		.update(name)
		.update(Math.random().toString())
		.digest('base64');

	var _packet = this.connection.build(comm.packets.magic.req,
					type,
					-1,
					[name, uuid, workload]
				);

	this.connection.send(_packet);
};

Client.prototype.responses = function()
{
	var client = this;
	this.connection.on(comm.packets.types.WORK_COMPLETE, function(_data)
	{
		var response = comm.Connection.parse_body(_data.data, 2);
		var handle = response[0].toString('utf8'),
			data = response[1].toString('utf8');

		client.emit('response', data, handle);
	});
};

exports.Client = Client;
