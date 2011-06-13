# GearNode

A Gearman Worker/Client library for NodeJS

## Modules Required

### Put

The Put module is required for interacting with binary packets going to and from the Job Server. You can install it using [NPM](http://npmjs.org/) with `npm install put` in a module directory the Gearman module can see.

## Using GearNode

To use GearNode, you must have NodeJS installed, and a working Gearman Job Server somewhere available to you.

### Creating a worker

To create a worker that will talk to the job server on `localhost`, use

    var Worker = require('worker.js').Worker;
    _worker = new Worker();

### Registering a job for the Worker

Once you have a worker that is connected and initialized, use the `submit` method to tell the job server the worker can do a specific task.

    _worker.register('some_function', function(_workload){return 'some response';});

The first parameter in the register function is the name of the function the worker can do (the client must request work using this name), and the second is the callback that actually preforms the required work. If the callback returns something, and the job server is expecting a response, the `return`ed information will be sent back to the client.

### Creating a client

Once a worker has been registered to do some work for the job server, a client must be used to request work, and send some workload to be worked on. To create a client that will talk to the job server on `localhost`, use

    var Client = require('client.js').Client;
    _client = new Client();

### Submitting work to be completed

Once a working client has been established, it may submit a job to the job server for a worker to preform. To do this, use the `submit` method

    _client.submit('some_function', 'some workload to pass to the job server');

### Connecting to a host other than localhost

To connect to a paricular host other than `localhost`, you may pass a hostname and port as paramters to the constructor of Worker or Client. For example,

    _worker = new Worker('hostname', 4730);
    _client = new Client('hostname', 4730);
