var comm 	= require('./communication.js'),
    crypto	= require('crypto');

function Client(server, port)
{
	this.connection = new comm.Connection(server, port);
	this.responses();
};

Client.prototype.submit = function(name, workload, priority, background, callback)
{
	// Register the call back for work
	this.on('response', function(_data){
		callback(_data);
	});

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
	client = this;
	this.connection.on(comm.packets.types.WORK_COMPLETE, function(_data)
	{
		client.emit('response', comm.Connection.parse_body(_data.data, 2)[1].toString('utf8'));
	});
}

exports.Client = Client;
