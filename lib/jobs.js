/**
 * This object holds the information about a job that the worker is to preform. 
 * This object is used by the Worker to preform an action that is requested by 
 * the Job server.
 *
 * @author Velsoft Training Materials, Inc.
 */
function Jobs(name, func)
{
	this.jobs = new Array();
}

Jobs.prototype.push = function(name, func)
{
	if(!(func instanceof Function))
		throw Error('You must pass a function as a job parameter');

	var _job = {
		name: 	name,
		func:	func
	};
	this.jobs.push(_job);
}

Jobs.prototype.find = function(name)
{
	var _func;

	this.jobs.some(function(_job)
	{
		if(_job.name == name)
		{
			_func = _job.func;
			return true;
		}
	});

	if(!(_func instanceof Function))
		throw Error("Cannot find function for Job");

	return _func;	
}

exports.Jobs = Jobs;
