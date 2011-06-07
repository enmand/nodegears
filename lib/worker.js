comm = require('./communication.js');

function Worker()
{
	this.functions = [];
	this.responses();
};
Worker.prototype = new comm.Connection();

Worker.prototype.register = function(name, func)
{
	this.functions.push(name, func);

	_packet = this.build(comm.packets.magic.req,
				comm.packets.types.CAN_DO,
				name.length,
				name
			);
	this.send(_packet);
	this.check();
}

Worker.prototype.check = function()
{
	_packet = this.build(comm.packets.magic.req,
				comm.packets.types.GRAB_JOB
			);
	this.send(_packet);
}

Worker.prototype.responses = function()
{
	worker = this;
	this.connection.on(comm.packets.types.NO_JOB, function()
	{
		worker.sleep();
	});
	this.connection.on(comm.packets.types.NOOP, function()
	{
		worker.check();
	});
}

Worker.prototype.sleep = function()
{
	_packet = this.build(comm.packets.magic.req,
				comm.packets.types.PRE_SLEEP
			);
	this.send(_packet);
}


exports.Worker = Worker;
