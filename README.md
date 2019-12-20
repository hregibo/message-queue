# MessageQueue

A simple queue manager that allows sub-queues to have different delays!

## Installation

To install this package, simply run the following command:

```bash
npm i -S @hregibo/message-queue
```

**Please note**: This package is made for NodeJS and in no way is made for the browser. You might want to transpile it or suggest a merge request if you wish to implement a browser-side message queue.

## Usage

The source code uses TypeScript, and the typings for this package are included in the package itself. This means you can both use it in TypeScript and JavaScript without any additional package for types. 

If you use TypeScript, the first step is to import the package to your file:

```typescript
import { MessageQueue } from "@hregibo/message-queue";
```

Or, if you prefer to use Javascript:

```Javascript
const MessageQueue = require("@hregibo/message-queue");
```

Once this is done, you just need to instanciate a new MessageQueue and set up some event listeners, then start the queue:

```typescript 
const mq = new MessageQueue();
mq.on("dequeue", record => {
    console.log("dequeued the following message:", record.message);
});
mq.emit("start");
```

If you do not need to use the queue anymore, or want to simply stop the polling, you can call the `stop` event instead of `start`:

```typescript
mq.emit("stop");
```

For more informations on the available events and examples, please scroll further below.

## Events

The message queue has the following events set up:

### `enqueue`

queues a message in the MessageQueue. If you make the MessageQueue emit this event, the payload of the event must be an object with the following properties:

|property|type|description|
|---|---|---|
|message|string|The message to enqueue|
|queue|string|The queue name to which the message needs to be added to. If the queue does not exists yet, a new one will be created with the default values.|
|priority|number|The priority of the message. The lowest the number is, the more priority it has. Number should be positive.|

```typescript
someMessageQueue.emit("enqueue", {
    queue: "some-queue-name",
    priority: 1, // highest priority!
    message: "PRIVMSG #channel :Hello there!",
});
```

### `dequeue`

emitted by the MessageQueue itself when dequeueing/polling a message from the queue. The payload will be the same object as the `enqueue` event payload.

```typescript
someMessageQueue.on("dequeue", record => {
    console.log(
        "Here is a dequeued message:",
        record.message,
        "It's coming from the queue named",
        record.queue,
        "and was with a priority of",
        record.priority,
    );
});
```

### `remove`

removes a queue from the MessageQueue, based on its name.

```typescript
// We do not need that queue anymore, we remove it
someMessageQueue.emit("remove", "some-queue-name");
```

### `purge`

clears a queue from all the messages it contains

```typescript
// Let's get rid of all the messages of the queue!
someMessageQueue.emit("purge", "some-queue-name");
```

### `start`

starts the queue polling. This should be emitted by you once your system is set up to listen to all the events you wish for, and ready to process the queue messages in other parts of your application.

```typescript
// We are ready to handle queue messages
someMessageQueue.emit("start");
```

### `stop`

stops the queue polling. This should be emitted by you if you desire to pause the queue, or if you have to clean-shutdown your application.

```typescript
// Let's take a break!
someMessageQueue.emit("stop");
```

## Methods

s

## Static properties

s

## Examples of usage

s

## Contributing

s