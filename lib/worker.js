comm = require('./communication.js');
Jobs = require('./jobs.js').Jobs;

function Worker()
{
	this.jobs = new Jobs();
	this.responses();
};
Worker.prototype = new comm.Connection();

Worker.prototype.register = function(name, func)
{	
	this.jobs.push(name, func);
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

	this.connection.on(comm.packets.types.JOB_ASSIGN, function(_packet)
	{
		var _body = worker.parse_body(_packet.data, 3);
		var _handle = _body.shift(),
		    _name = _body.shift().toString(),
	            _workload = _body.shift().toString();

		var func = worker.jobs.find(_name);
		var _resp = func.apply(worker, [_workload.toString()]);

		_packet = worker.build(comm.packets.magic.req,
					comm.packets.types.WORK_COMPLETE,
					-1,
					[_handle, _resp]
			);
		worker.send(_packet);
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
