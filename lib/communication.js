require('./utils');
var Buffers = require('buffers'),
	net = require('net');
/**
 * Gearman packets have the following attributes:
 *	Each packet starts with a 4 byte "magic" code: \0REQ or \0RES
 *	Each packet then has a 4 byte type code, defined in packets.types
 *	Each packet then has the 4 byte lengh of the
 *	Finally, each packet has a body that sends or recieves the required
 *		packet information
 */
packets = {
	magic: { // Our magic types
		req: new Buffer([0x00, 0x52, 0x45, 0x51]),
		res: new Buffer([0x00, 0x42, 0x45, 0x53])
	},
	types: { // Packet types for both clients and workers
		CAN_DO:			new Buffer([0x00, 0x00, 0x00, 0x01]),
		CANT_DO:		new Buffer([0x00, 0x00, 0x00, 0x02]),
		RESET_ABILITIES:	new Buffer([0x00, 0x00, 0x00, 0x03]),
		PRE_SLEEP:		new Buffer([0x00, 0x00, 0x00, 0x04]),
		NOOP:			new Buffer([0x00, 0x00, 0x00, 0x06]),
		SUBMIT_JOB: 		new Buffer([0x00, 0x00, 0x00, 0x07]),
		JOB_CREATED:		new Buffer([0x00, 0x00, 0x00, 0x08]),
		GRAB_JOB:		new Buffer([0x00, 0x00, 0x00, 0x09]),
		NO_JOB:			new Buffer([0x00, 0x00, 0x00, 0x0a]),
		JOB_ASSIGN:		new Buffer([0x00, 0x00, 0x00, 0x0b]),
		WORK_STATUS:		new Buffer([0x00, 0x00, 0x00, 0x0c]),	
		WORK_COMPLETE:		new Buffer([0x00, 0x00, 0x00, 0x0d]),	
		WORK_FAIL:		new Buffer([0x00, 0x00, 0x00, 0x0e]),
		GET_STATUS:		new Buffer([0x00, 0x00, 0x00, 0x0f]),
		ECHO_REQ:		new Buffer([0x00, 0x00, 0x00, 0x10]),
		ECHO_RES:		new Buffer([0x00, 0x00, 0x00, 0x11]),
		SUBMIT_JOB_BG:		new Buffer([0x00, 0x00, 0x00, 0x12]),
		ERROR:			new Buffer([0x00, 0x00, 0x00, 0x13]),
		STATUS_RES:		new Buffer([0x00, 0x00, 0x00, 0x14]),
		SUBMIT_JOB_HIGH: 	new Buffer([0x00, 0x00, 0x00, 0x15]),
		SET_CLIENT_ID:		new Buffer([0x00, 0x00, 0x00, 0x16]),
		CAN_DO_TIMEOUT:		new Buffer([0x00, 0x00, 0x00, 0x17]),
		ALL_YOURS:		new Buffer([0x00, 0x00, 0x00, 0x18]),
		WORK_EXCEPTION:		new Buffer([0x00, 0x00, 0x00, 0x19]),
		OPTION_REQ:		new Buffer([0x00, 0x00, 0x00, 0x1a]),
		OPTION_RES:		new Buffer([0x00, 0x00, 0x00, 0x1b]),
		WORK_DATA:		new Buffer([0x00, 0x00, 0x00, 0x1c]),
		WORK_WORKING:		new Buffer([0x00, 0x00, 0x00, 0x1d]),
		GRAB_JOB_UNIQ:		new Buffer([0x00, 0x00, 0x00, 0x1e]),
		JOG_ASSIGN_UNIQ:	new Buffer([0x00, 0x00, 0x00, 0x1f]),
		SUBMIT_JOB_HIGH_BG:	new Buffer([0x00, 0x00, 0x00, 0x20]),
		SUBMIT_JOB_LOW:		new Buffer([0x00, 0x00, 0x00, 0x21]),
		SUBMIT_JOB_LOW_BG:	new Buffer([0x00, 0x00, 0x00, 0x22]),
		SUBMIT_JOB_SCHED:	new Buffer([0x00, 0x00, 0x00, 0x23]),
		SUBMIT_JOB_EPOCH:	new Buffer([0x00, 0x00, 0x00, 0x24]),
	},

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
	build: function(magic, type, length, body)
	{
		if( ! (Buffer.isBuffer(magic) || Buffer.isBuffer(type) || Buffer.isBuffer(length) || Buffer.isBuffer(body)) )
			throw Error('Packets must be built from a set of Buffer objects');

		var packet = Buffers([magic, type, length, body]);
		return packet.slice();
	},

	/**
	 * Read a recieved packet from the job server, and decode it so that
	 * we know what to do with it
	 *
	 * @function
	 * @param buffer The buffer of bytes you recieved
	 */
	read: function(buffer)
	{
		if(!Buffer.isBuffer(buffer))
			throw Error('Readable packets must be buffers');

		console.dir(buffer);

		packet = {
			magic:	buffer.slice(0, 4),
			type:	buffer.slice(4, 8),
			length:	buffer.slice(8, 12),
		}
		packet.data = buffer.slice(12);

		this.magic.findByValue(packet.magic);

		if(!this.magic.findByValue(packet.magic))
			throw Error("Invalid magic header");

		if(!this.types.findByValue(packet.type))
			throw Error('Invalid packet type');
		return packet;
	}
};

function Connection(server, port)
{
	if(this.connection)
		return this.server.connection;

	this.info = 
	{
		host: server || "localhost",
		port: port || 4730,
	}

	this.connection = net.createConnection(this.info.port, this.info.host);
	return this.connection;
}

exports.packets = packets;
exports.Connection = Connection;
