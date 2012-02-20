var comm = require('./communication.js'),
    Jobs = require('./jobs.js').Jobs;

function Worker(server, port)
{
	this.connection = new comm.Connection(server, port);
	this.jobs = new Jobs();
	this.responses();
};

Worker.prototype.register = function(name, func)
{	
	this.jobs.push(name, func);
	_packet = this.connection.build(comm.packets.magic.req,
				comm.packets.types.CAN_DO,
				name.length,
				name
			);
	this.connection.send(_packet);
	this.check();
}

Worker.prototype.check = function()
{
	_packet = this.connection.build(comm.packets.magic.req,
					comm.packets.types.GRAB_JOB
				);
	this.connection.send(_packet);
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
		var _body 		= comm.Connection.parse_body(_packet.data, 3),
			_handle 	= _body.shift(),
		    _name 		= _body.shift().toString(),
	    	_workload 	= _body.shift().toString();

		var func = worker.jobs.find(_name);
		func.apply(worker, [_workload.toString(), function(_resp){
			if(_resp == undefined)
				_response = "";
			else
				_response = _resp.toString();

			_packet = worker.connection.build(comm.packets.magic.req,
							comm.packets.types.WORK_COMPLETE,
							-1,
							[_handle, _response]
				);
			worker.connection.send(_packet);
			worker.check();			
		}]);
	});
}

Worker.prototype.sleep = function()
{
	_packet = this.connection.build(comm.packets.magic.req,
					comm.packets.types.PRE_SLEEP
				);
	
	this.connection.send(_packet);
}

exports.Worker = Worker;
