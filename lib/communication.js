require('./_utils');
var Put 	= require('put'),
    net		= require('net'),
    util	= require('util'),
    EventEmitter= require('events').EventEmitter;

/**
 * Gearman packets have the following attributes:
 *	Each packet starts with a 4 byte "magic" code: \0REQ or \0RES
 *	Each packet then has a 4 byte type code, defined in packets.types
 *	Each packet then has the 4 byte lengh of the
 *	Finally, each packet has a body that sends or recieves the required
 *		packet information
 */
var packets = {
	magic: { // Our magic types
		req: new Buffer([0x00, 0x52, 0x45, 0x51]),
		res: new Buffer([0x00, 0x52, 0x45, 0x53])
	},
	types: { // Packet types for both clients and workers
		CAN_DO:				new Buffer([0x00, 0x00, 0x00, 0x01]),
		CANT_DO:			new Buffer([0x00, 0x00, 0x00, 0x02]),
		RESET_ABILITIES:	new Buffer([0x00, 0x00, 0x00, 0x03]),
		PRE_SLEEP:			new Buffer([0x00, 0x00, 0x00, 0x04]),
		NOOP:				new Buffer([0x00, 0x00, 0x00, 0x06]),
		SUBMIT_JOB: 		new Buffer([0x00, 0x00, 0x00, 0x07]),
		JOB_CREATED:		new Buffer([0x00, 0x00, 0x00, 0x08]),
		GRAB_JOB:			new Buffer([0x00, 0x00, 0x00, 0x09]),
		NO_JOB:				new Buffer([0x00, 0x00, 0x00, 0x0a]),
		JOB_ASSIGN:			new Buffer([0x00, 0x00, 0x00, 0x0b]),
		WORK_STATUS:		new Buffer([0x00, 0x00, 0x00, 0x0c]),	
		WORK_COMPLETE:		new Buffer([0x00, 0x00, 0x00, 0x0d]),	
		WORK_FAIL:			new Buffer([0x00, 0x00, 0x00, 0x0e]),
		GET_STATUS:			new Buffer([0x00, 0x00, 0x00, 0x0f]),
		ECHO_REQ:			new Buffer([0x00, 0x00, 0x00, 0x10]),
		ECHO_RES:			new Buffer([0x00, 0x00, 0x00, 0x11]),
		SUBMIT_JOB_BG:		new Buffer([0x00, 0x00, 0x00, 0x12]),
		ERROR:				new Buffer([0x00, 0x00, 0x00, 0x13]),
		STATUS_RES:			new Buffer([0x00, 0x00, 0x00, 0x14]),
		SUBMIT_JOB_HIGH: 	new Buffer([0x00, 0x00, 0x00, 0x15]),
		SET_CLIENT_ID:		new Buffer([0x00, 0x00, 0x00, 0x16]),
		CAN_DO_TIMEOUT:		new Buffer([0x00, 0x00, 0x00, 0x17]),
		ALL_YOURS:			new Buffer([0x00, 0x00, 0x00, 0x18]),
		WORK_EXCEPTION:		new Buffer([0x00, 0x00, 0x00, 0x19]),
		OPTION_REQ:			new Buffer([0x00, 0x00, 0x00, 0x1a]),
		OPTION_RES:			new Buffer([0x00, 0x00, 0x00, 0x1b]),
		WORK_DATA:			new Buffer([0x00, 0x00, 0x00, 0x1c]),
		WORK_WORKING:		new Buffer([0x00, 0x00, 0x00, 0x1d]),
		GRAB_JOB_UNIQ:		new Buffer([0x00, 0x00, 0x00, 0x1e]),
		JOG_ASSIGN_UNIQ:	new Buffer([0x00, 0x00, 0x00, 0x1f]),
		SUBMIT_JOB_HIGH_BG:	new Buffer([0x00, 0x00, 0x00, 0x20]),
		SUBMIT_JOB_LOW:		new Buffer([0x00, 0x00, 0x00, 0x21]),
		SUBMIT_JOB_LOW_BG:	new Buffer([0x00, 0x00, 0x00, 0x22]),
		SUBMIT_JOB_SCHED:	new Buffer([0x00, 0x00, 0x00, 0x23]),
		SUBMIT_JOB_EPOCH:	new Buffer([0x00, 0x00, 0x00, 0x24]),
	},
};

function Connection(server, port)
{
	this.on(packets.types.ERROR, function(_packet)
	{
		var _body = this.parse_body(_packet.body, 2);
		process.stderr.write('ERROR FROM JOB SERVER: ' + _body[0] + ' (' + _body[1] + ')' );
		this.emit('ERROR_'+_body[0], _body);
	});

	if(!this.connection)
		this.connect(server, port);
}

// Connection will emit events based on reveived packets
util.inherits(Connection, EventEmitter);


/**
 * Connect the the Job Server, and leave the connection open, while we wait
 * for instruction
 * 
 * @function
 * @param server The server hostname we are connecting to
 * @param port The port the server is running on
 */
Connection.prototype.connect = function(server, port)
{
	this.info = 
	{
		host: server || "localhost",
		port: port || 4730,
	}

	this.connection = net.createConnection(this.info.port, this.info.host);

	this.connection.on('connect', function()
	{	
		this.setEncoding('binary');
		this.setNoDelay();
	});

	var conn = this;
	var _packet = {};

	this.connection.on('data', function(d)
	{
		// Do we have a packet from our last event?
		if(_packet.hasOwnProperty("data") && _packet.hasOwnProperty("length"))
		{
			// _packet.length is the remaining before we read
			var remaining = _packet.remaining - _packet.bufSize;
			var tpacket = conn.read(d, remaining);
			var last = (tpacket.remaining - tpacket.bufSize) <= 0;
			var tbuf = new Buffer(tpacket.bufSize + _packet.data.length);
			
			// Copy the data into our new buffer
			_packet.data.copy(tbuf);
			tpacket.data.copy(tbuf, _packet.data.length);

			_packet.data = tbuf; // The full packet data
			_packet.remaining = tpacket.remaining;
			_packet.bufSize = tpacket.bufSize
			
			if(last) // This is our last packet
			{
				conn.emit(_packet.type, _packet);
				_packet = {};
			}
		} else
		{
			_packet = conn.read(d, 0);

			// This is the total packet
			if(_packet.length == 0 || _packet.bufSize == _packet.length)
			{
				conn.emit(_packet.type, _packet);
				_packet = {};
			}
		}
	});
}

/**
 * Disconnect from the job server.
 *
 * @function
 */
Connection.prototype.disconnect = function()
{
	this.connection.end();
}

/**
 * Read a recieved packet from the job server, and decode it so that
 * we know what to do with it.
 *
 * An important note: it is the job of whichever object recieves this event
 * to parse the body how it will require it.
 *
 * @function
 * @param buffer The buffer of bytes you recieved
 */
Connection.prototype.read = function(buffer, remaining)
{
	var buffer = Buffer(buffer, 'binary');

	if(!Buffer.isBuffer(buffer))
		throw Error('Readable packets must be buffers');

	if(remaining == 0)
	{
		var _packet = {
			magic:	buffer.slice(0, 4),
			type:	buffer.slice(4, 8),
			length:	buffer.slice(8, 12).readUInt32BE(0),
		}
		_packet.data = buffer.slice(12);
		_packet.bufSize = _packet.data.length
		_packet.remaining = _packet.length;

		if(!packets.magic.findByValue(_packet.magic))
			throw Error("Invalid magic header");

		if(!packets.types.findByValue(_packet.type))
			throw Error('Invalid packet type');
	} else
	{
		var _packet = 
		{
			data: 		buffer,
			remaining: 	remaining,
			bufSize: 	buffer.length
		}
	}
	return _packet;
}

/**
 * Build a packet that can be sent to the Job Server as a request or
 * as a response to a request from the job server
 *
 * @function
 * @param magic The packet magic type
 * @param type The packet byte type
 * @param length The length of the body
 * @param body An array of buffers that act as the body of the packet
 */
Connection.prototype.build = function(magic, type, length, body)
{
	var length = length || new Buffer([0x00]);
	var _packet = Put()
		.put(magic)
		.put(type)

	if(length >= 0 || length instanceof Buffer)
	{
		_packet.word32be(length);
	}

	if(body)
	{
		if(body instanceof Array)
		{
			var _size = 0;
			var _queue = [];
			body.forEach(function(value, key)
			{
				var _newvalue = Put()
						.put(new Buffer(value));
				if(key != body.length - 1)
				{
					_newvalue.word8(0);
				}
				_size += _newvalue.buffer().length;
				_queue.push(_newvalue.buffer());
			});
			_packet.word32be(_size);
			_queue.forEach(function(value){_packet.put(value)});
		} else
		{
			var body = new Buffer(body.toString());
			_packet.put(body);
		}
	}

	return _packet.buffer();
}

/**
 * Send a buffer through the socket to the server to be read and acted on
 * by the job server. The packet must be a buffer (usually built by the
 * Connection.prototype.build function) with the correct magic and type
 * information
 *
 * @function
 * @param buffer The buffer to send as the binary packet
 */
Connection.prototype.send = function(buffer)
{
	if(this.connection.readyState != 'open') // Don't pre-buffer
	{
		var send = this;
		process.nextTick(function(){
			send.send(buffer)
		});
	} else
	{
		var conn = this.connection;
		process.nextTick(function()
		{
			conn.write(buffer, 'binary');
		});
	}
}

/**
 * Test our connection to the Job Server. ECHO_REQ should generate an
 * ECHO_RES response from the Job Server
 *
 * @function
 */
Connection.prototype.test = function()
{
	var _packet = this.build(comm.packets.magic.req,
				comm.packets.types.ECHO_REQ,
				-1,
				['ECHO', 'REQ']
			);

	this.send(_packet);
}

/**
 * Parse the packet body for the arguements that the packet type requires.
 * This will break the packet body into it's argument form (arguements are
 * separated by a NULL terminator)
 *
 * @function
 * @param body The packet body
 * @param size The number of arguements to split by
 */
Connection.parse_body = function(body, size)
{
	var arguements = [];
	var start = 0;

	for(var i = 0; i <= body.length; i++)
	{
		if(arguements.length === size) break;
		if(body[i] === 0x00 || body.length == i)

		{
			var _new = new Buffer(i - start);
			body.copy(_new, 0, start, i);
			arguements.push(_new);
			start = i + 1; // Don't include the NULL byte at the end
		}
	}
	return arguements;
}

exports.packets = packets;
exports.Connection = Connection;
