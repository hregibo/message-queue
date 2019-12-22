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


## Static properties

There are a bunch of static properties directly in MessageQueue that allow to define the default values of new queues:

|Property|Description|
|---|---|
|`DEFAULT_QUEUE_PRIORITY`|This is the default priority for queues that are not created yet, but are still receiving an enqueue request. Lower is better.|
|`DEFAULT_QUEUE_POLLING_MS`|This is the default polling delay for the MEssageQueue. Value is in milliseconds.|
|`DEFAULT_QUEUE_DELAY_MS`|This is the default delay between two messages to be sent for one specific queue. Value is in milliseconds.|


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

If you prefer to use directly the methods, you can do so by calling the methods directly. All methods are public.

### `onStop`

This method is the equivalent of emitting a  `stop` event.

```typescript
someMessageQueue.onStop();
```

### `onStart`

This method is the equivalent of emitting a `start` event.

```typescript
someMessageQueue.onStart();
```

### `enqueue`

puts a given message in a queue. If the queue does not exists yet, it will be created with the default values (which you can customize using the static properties). This method takes one argument, which is a QueueMessage.

```typescript
someMessageQueue.enqueue({
    queue: "some-queue-name",
    message: "Hello world",
    priority: 100,
});
```

### `onEnqueue`

This is the method called when emitting a `enqueue` event. For now, it has no other use than calling the `enqueue` method, but that might change in the future, if some processing of the event data needs to be done.

```typescript
someMessageQueue.onEnqueue({
    queue: "some-queue-name",
    message: "Hello world",
    priority: 100,
});
```

### `setQueue`

This method allows you to update the delay and priority of a existing queue, or create one if it does not exists yet.

The only parameter is an object which contains 3 properties: `name` (the name of the queue), `delay` (the delay of the queue, in milliseconds) and `priority` (the priority of the queue compared to other queues).

```typescript
someMessageQueue.setQueue({
    name: "some-message-queue",
    delay: 1500,
    priority: 10,
});
```

### `onRemove`

Same behaviour as calling the `remove` event. Takes a string (the queue name) as an argument.

```typescript
someMessageQueue.onRemove("some-queue-name");
```

### `onPurge`

Same behaviour as calling the `purge` event. Takes a string (the queue name) as an argument.

```typescript 
someMessageQueue.onPurge("some-queue-name");
```

### `onQueueSet`

Sets a queue with the new delay and priority, if specified. Takes an object as an argument, with the properties `name` (the queue name), `delay` (the delay between two messages in milliseconds, optional) and `priority` (the priority of the queue compared to other queues, in milliseconds, optional).

```typescript
someMessageQueue.onQueueSet({
    name: "some-message-queue",
    delay: 1350,
    priority: 25,
});
```

### `dequeue`

Internal method. Used to trigger a search for the most important message to send, then emits a `dequeue` event. You should not use this method.

### `orderByPriority`

Internal utility method. Takes a list of IPriorityObject and sorts them to always have the lowest priority first in the array. You might want to use it if you need to sort an array of objects having the `priority` property.

```typescript
const myMessages = [
    {id: 1, priority: 10},
    {id: 2, priority: 3},
    {id: 3, priority: 7},
    {id: 4, priority: 1},
];
const orderedMessageList = someMessageQueue.orderByPriority(myMessages);
// [ {id: 4, priority: 1}, {id: 2, priority: 3}, {id: 3, priority: 7}, {id: 1, priority: 10}]
```

### `getElligibleMessage`

Finds the first elligible message for a given queue, or undefined if none matches.

```typescript
const elligibleMessage = someMessageQueue.getElligibleMessage(someQueue);
```


## Example of usage

This library is made at the very beginning for a IRC client I created. The reason we have a global delay and per-queue delay is that the IRC client is limited in the number of messages we can send every 30 seconds, while each channel you join has a limitation based on your status (moderator has no limit, others can post one message every 1500ms). The following example shows a basic implementation for an IRC client:

```typescript
import { MessageQueue } from "@hregibo/message-queue";
import { ChannelList } from "./channels";
import { SomeIrcLibrary } from "./client";

const mq = new MessageQueue();
const irc = new SomeIrcLibrary();

mq.setQueue({
    name: "command-queue",
    priority: 1, // the commands are more important than anything else
});

// We set the polling timer to 60ms, which is the allowed rate for the bot
MessageQueue.DEFAULT_QUEUE_POLLING_MS = 60;
// We set the delay for each queue to be 1500 by default
MessageQueue.DEFAULT_QUEUE_DELAY_MS = 1500;

for(const channel of ChannelList) {
    // we create a queue for each channel we join
    mq.setQueue({
        name: channel.name,
        // Giving the delay for the queue will override the default one
        delay: MessageQueue.DEFAULT_QUEUE_POLLING_MS,
    });
    // We add the channel JOIN request to the command queue
    mq.emit("enqueue", {
        queue: "command-queue",
        message: `JOIN #${channel.name}`,
        priority: 5,
    });
}

mq.on("dequeue", (record) => {
    // Whenever a message is dequeued, we send it via IRC
    irc.send(record.message);
})

irc.on("ready", () => {
    // The IRC client is connected and authenticatedmess
    // We start the polling of the queue
    mq.emit("start");
});

irc.on("disconnect", () => {
    mq.emit("stop");
});

irc.on("message", (msg) => {
    if (msg.content === "!hello") {
        // The user used the hello command, we say hello back!
        mq.emit("enqueue", {
            // msg.channel is the name of the channel, i.e. #hregibo
            queue: msg.channel,
            message: `PRIVMSG #${msg.channel} :Hello there, ${msg.user.name}!`,
            priority: 100,
        });
    }
});
```