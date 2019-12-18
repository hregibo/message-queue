import { IQueueMessage, MessageQueue } from "./message-queue";
// Jest configuration
jest.useFakeTimers();

describe("MessageQueue", () => {
    describe("Static variables", () => {
        it("should have the 'DEFAULT_QUEUE_POLLING_MS' attribute set to 60 by default", () => {
            expect(MessageQueue.DEFAULT_QUEUE_POLLING_MS).toEqual(60);
        });
        it("should have the 'DEFAULT_QUEUE_PRIORITY' attribute set to 100 by default", () => {
            expect(MessageQueue.DEFAULT_QUEUE_PRIORITY).toEqual(100);
        });
        it("should have the 'DEFAULT_QUEUE_DELAY_MS' attribute set to 1250 by default", () => {
            expect(MessageQueue.DEFAULT_QUEUE_DELAY_MS).toEqual(1250);
        });
    });
    describe("Constructor", () => {
        const testParameter = {
            message: "WHOAMI",
            priority: 1,
            queue: "queueName",
        };
        it("should have the queues map instanciated", () => {
            const mq = new MessageQueue();
            expect(mq.queues).toBeInstanceOf(Map);
            expect(mq.queues.size).toEqual(0);
        });
        it("should have the 'interval' property at undefined by default", () => {
            const mq = new MessageQueue();
            expect(typeof mq.interval).toEqual("undefined");
        });
        it("should have the pollingDelay set at the same value as the default value", () => {
            const mq = new MessageQueue();
            expect(mq.pollingDelay).toEqual(MessageQueue.DEFAULT_QUEUE_POLLING_MS);
        });
        it("should have the queue disabled by default", () => {
            const mq = new MessageQueue();
            expect(mq.enabled).toBeFalsy();
        });
        it("should listen to the 'enqueue' event", () => {
            const mq = new MessageQueue();
            expect(mq.listenerCount("enqueue")).toEqual(1);
        });
        it("should trigger a call to 'onEnqueue' when the 'enqueue' event is fired", () => {
            expect.assertions(2);
            const mq = new MessageQueue();
            const mockedEnqueueCall = jest.spyOn(mq, "onEnqueue");
            mockedEnqueueCall.mockImplementationOnce((message) => {
                expect(message).toEqual(testParameter);
            });
            mq.emit("enqueue", testParameter);
            expect(mockedEnqueueCall).toHaveBeenCalledTimes(1);
        });
        it("should listen to the 'remove' event", () => {
            const mq = new MessageQueue();
            expect(mq.listenerCount("remove")).toEqual(1);
        });
        it("should listen to the 'start' event", () => {
            const mq = new MessageQueue();
            expect(mq.listenerCount("start")).toEqual(1);
        });
        it("should listen to the 'stop' event", () => {
            const mq = new MessageQueue();
            expect(mq.listenerCount("stop")).toEqual(1);
        });
        it("should trigger a call to 'onRemove' when the 'remove' event is fired", () => {
            expect.assertions(2);
            const mq = new MessageQueue();
            const testValue = "fakeQueue";
            const mockedRemoveCall = jest.spyOn(mq, "onRemove");
            mockedRemoveCall.mockImplementationOnce((message) => {
                expect(message).toEqual(testValue);
                return true;
            });
            mq.emit("remove", testValue);
            expect(mockedRemoveCall).toHaveBeenCalledTimes(1);
        });
        it("should listen to the 'purge' event", () => {
            const mq = new MessageQueue();
            expect(mq.listenerCount("purge")).toEqual(1);
        });
        it("should trigger a call to 'onPurge' when the 'purge' event is fired", () => {
            expect.assertions(2);
            const mq = new MessageQueue();
            const testValue = "fakeQueue";
            const mockedPurgeCall = jest.spyOn(mq, "onPurge");
            mockedPurgeCall.mockImplementationOnce((message) => {
                expect(message).toEqual(testValue);
                return true;
            });
            mq.emit("purge", testValue);
            expect(mockedPurgeCall).toHaveBeenCalledTimes(1);
        });
        it("should trigger a call to 'onStart' when the 'start' event is fired", () => {
            expect.assertions(1);
            const mq = new MessageQueue();
            const testValue = "fakeQueue";
            const mockedStartCall = jest.spyOn(mq, "onStart");
            mockedStartCall.mockImplementationOnce(() => {
                return true;
            });
            mq.emit("start", testValue);
            expect(mockedStartCall).toHaveBeenCalledTimes(1);
        });
        it("should trigger a call to 'onStop' when the 'stop' event is fired", () => {
            expect.assertions(1);
            const mq = new MessageQueue();
            const testValue = "fakeQueue";
            const mockedStopCall = jest.spyOn(mq, "onStop");
            mockedStopCall.mockImplementationOnce(() => {
                return true;
            });
            mq.emit("stop", testValue);
            expect(mockedStopCall).toHaveBeenCalledTimes(1);
        });
        it("should have the 'on' function as it inherits EventEmitter", () => {
            const mq = new MessageQueue();
            expect(mq.on).not.toBeUndefined();
            expect(typeof mq.on).toEqual("function");
        });
        it("should have the 'emit' function as it inherits EventEmitter", () => {
            const mq = new MessageQueue();
            expect(mq.emit).not.toBeUndefined();
            expect(typeof mq.emit).toEqual("function");
        });
    });
    describe("onEnqueue", () => {
        const testParameter = {
            message: "WHOAMI",
            priority: 1,
            queue: "queueName",
        };
        it("should trigger the 'enqueue' function and pass the received parameter", () => {
            expect.assertions(2);
            const mq = new MessageQueue();
            const mockedFn = jest.spyOn(mq, "enqueue");
            mockedFn.mockImplementationOnce((parameter) => {
                expect(parameter).toEqual(testParameter);
            });
            mq.onEnqueue(testParameter);
            expect(mockedFn).toHaveBeenCalled();
        });
    });
    describe("enqueue", () => {
        const testParameter = {
            message: "WHOAMI",
            priority: 1,
            queue: "queueName",
        };
        const testQueue = {
            delay: MessageQueue.DEFAULT_QUEUE_DELAY_MS,
            priority: MessageQueue.DEFAULT_QUEUE_PRIORITY,
            queue: [],
            sent_at: 0,
        };
        it("should create a new queue if it does not exists yet", () => {
            const mq = new MessageQueue();
            expect(mq.queues.size).toBe(0);
            mq.enqueue(testParameter);
            expect(mq.queues.size).toBe(1);
            const savedQueue = mq.queues.get(testParameter.queue);
            if (savedQueue) {
                expect(savedQueue).not.toBeUndefined();
                expect(savedQueue.priority).toBe(MessageQueue.DEFAULT_QUEUE_PRIORITY);
                expect(savedQueue.delay).toBe(MessageQueue.DEFAULT_QUEUE_DELAY_MS);
                expect(savedQueue.sent_at).toBe(0);
            } else {
                expect(true).toBeFalsy();
            }
        });
        it("should add to the queue the message if the queue already exists", () => {
            const mq = new MessageQueue();
            mq.queues.set(testParameter.queue, testQueue);
            const createdQueue = mq.queues.get(testParameter.queue);

            expect(mq.queues.size).toBe(1);
            if (createdQueue) {
                expect(createdQueue).toEqual(testQueue);
                expect(createdQueue.queue.length).toBe(0);
            } else {
                expect(true).toBeFalsy();
            }
            mq.enqueue(testParameter);
            expect(mq.queues.size).toBe(1);
            if (createdQueue) {
                expect(createdQueue).toEqual(testQueue);
                expect(createdQueue.queue.length).toBe(1);
            } else {
                expect(true).toBeFalsy();
            }
        });
        it("should have a length of 1 in the given queue", () => {
            const mq = new MessageQueue();
            mq.enqueue(testParameter);
            const savedQueue = mq.queues.get(testParameter.queue);
            if (savedQueue) {
                expect(savedQueue.queue.length).toBe(1);
            } else {
                expect(true).toBeFalsy();
            }
        });
    });
    describe("onQueueSet", () => {
        const testParameter = {
            delay: 1000,
            name: "queueName",
            priority: 1,
        };
        it("should trigger the 'enqueue' function and pass the received parameter", () => {
            expect.assertions(2);
            const mq = new MessageQueue();
            const mockedFn = jest.spyOn(mq, "setQueue");
            mockedFn.mockImplementationOnce((parameter) => {
                expect(parameter).toEqual(testParameter);
            });
            mq.onQueueSet(testParameter);
            expect(mockedFn).toHaveBeenCalled();
        });
    });
    describe("setQueue", () => {
        it("should create a new queue if the one requested does not exists", () => {
            const creationQuery = {
                name: "queueName",
            };
            const mq = new MessageQueue();
            expect(mq.queues.size).toBe(0);
            mq.setQueue(creationQuery);
            expect(mq.queues.size).toBe(1);
            const createdQueue = mq.queues.get(creationQuery.name);
            expect(createdQueue).not.toBeUndefined();
            if (createdQueue) {
                expect(createdQueue.queue.length).toBe(0);
                expect(createdQueue.priority).toBe(MessageQueue.DEFAULT_QUEUE_PRIORITY);
                expect(createdQueue.delay).toBe(MessageQueue.DEFAULT_QUEUE_DELAY_MS);
            } else {
                expect(true).toBeFalsy();
            }
        });
        it("should change nothing if neither the delay or the priority is changed", () => {
            const creationQuery = {
                name: "queueName",
            };
            const mq = new MessageQueue();
            // Creating the first queue and getting a derefered copy
            mq.setQueue(creationQuery);
            expect(mq.queues.size).toBe(1);
            const q1 = Object.assign({}, mq.queues.get(creationQuery.name));
            // Setting the same value, then derefering a copy
            mq.setQueue(creationQuery);
            expect(mq.queues.size).toBe(1);
            const q2 = Object.assign({}, mq.queues.get(creationQuery.name));
            if (q1 && q2) {
                expect(q1.delay).toBe(q2.delay);
                expect(q1.priority).toBe(q2.priority);
            } else {
                // Make tests fail if we dont have Q1 or Q2
                expect(true).toBeFalsy();
            }
        });
        it("should update the delay if we provide one", () => {
            const creationQuery = {
                name: "queueName",
            };
            const updateQuery = {
                delay: 45678,
                name: "queueName",
            };
            const mq = new MessageQueue();
            // Creating the first queue and getting a derefered copy
            mq.setQueue(creationQuery);
            expect(mq.queues.size).toBe(1);
            const q1 = Object.assign({}, mq.queues.get(creationQuery.name));
            // Setting the same value, then derefering a copy
            mq.setQueue(updateQuery);
            expect(mq.queues.size).toBe(1);
            const q2 = Object.assign({}, mq.queues.get(creationQuery.name));
            if (q1 && q2) {
                expect(q1.delay).not.toBe(q2.delay);
                expect(q1.priority).toBe(q2.priority);
                expect(q2.delay).toBe(updateQuery.delay);
            } else {
                // Make tests fail if we dont have Q1 or Q2
                expect(true).toBeFalsy();
            }
        });
        it("should update the priority if we provide one", () => {
            const creationQuery = {
                name: "queueName",
            };
            const updateQuery = {
                name: "queueName",
                priority: 150,
            };
            const mq = new MessageQueue();
            // Creating the first queue and getting a derefered copy
            mq.setQueue(creationQuery);
            expect(mq.queues.size).toBe(1);
            const q1 = Object.assign({}, mq.queues.get(creationQuery.name));
            // Setting the same value, then derefering a copy
            mq.setQueue(updateQuery);
            expect(mq.queues.size).toBe(1);
            const q2 = Object.assign({}, mq.queues.get(creationQuery.name));
            if (q1 && q2) {
                expect(q1.delay).toBe(q2.delay);
                expect(q1.priority).not.toBe(q2.priority);
                expect(q2.priority).toBe(updateQuery.priority);
            } else {
                // Make tests fail if we dont have Q1 or Q2
                expect(true).toBeFalsy();
            }
        });
        it("should update both delay and priority if we provide them", () => {
            const creationQuery = {
                name: "queueName",
            };
            const updateQuery = {
                delay: 12345,
                name: "queueName",
                priority: 123,
            };
            const mq = new MessageQueue();
            // Creating the first queue and getting a derefered copy
            mq.setQueue(creationQuery);
            expect(mq.queues.size).toBe(1);
            const q1 = Object.assign({}, mq.queues.get(creationQuery.name));
            // Setting the same value, then derefering a copy
            mq.setQueue(updateQuery);
            expect(mq.queues.size).toBe(1);
            const q2 = Object.assign({}, mq.queues.get(creationQuery.name));
            if (q1 && q2) {
                expect(q1.delay).not.toBe(q2.delay);
                expect(q1.priority).not.toBe(q2.priority);
                expect(q2.priority).toBe(updateQuery.priority);
                expect(q2.delay).toBe(updateQuery.delay);
            } else {
                // Make tests fail if we dont have Q1 or Q2
                expect(true).toBeFalsy();
            }
        });
    });
    describe("onRemove", () => {
        it("should return true as he found a queue to remove", () => {
            const mq = new MessageQueue();
            mq.queues.set("fakeQueue", {
                delay: 1,
                priority: 1,
                queue: [],
                sent_at: 0,
            });
            const spyDelete = jest.spyOn(mq.queues, "delete");

            expect(mq.queues.size).toBe(1);
            const foundAResult = mq.onRemove("fakeQueue");

            expect(mq.queues.size).toBe(0);
            expect(spyDelete).toHaveBeenCalledTimes(1);
            expect(foundAResult).toBeTruthy();
        });
        it("should return false as he found no queue to remove", () => {
            const mq = new MessageQueue();
            const spyDelete = jest.spyOn(mq.queues, "delete");
            const foundAResult = mq.onRemove("fakeQueue");

            expect(mq.queues.size).toBe(0);
            expect(spyDelete).toHaveBeenCalledTimes(1);
            expect(foundAResult).toBeFalsy();
        });
    });
    describe("onPurge", () => {
        it("should return true as he found a queue to purge", () => {
            const mq = new MessageQueue();
            const fakeQueue = {
                delay: 1,
                priority: 1,
                queue: [{priority: 1, queue: "fakeQueue", message: "WHOAMI"}],
                sent_at: 0,
            };
            mq.queues.set("fakeQueue", fakeQueue);
            const spyDelete = jest.spyOn(mq.queues, "get");

            expect(mq.queues.size).toBe(1);
            expect(fakeQueue.queue.length).toBe(1);
            const foundAResult = mq.onPurge("fakeQueue");

            expect(mq.queues.size).toBe(1);
            expect(fakeQueue.queue.length).toBe(0);
            expect(spyDelete).toHaveBeenCalledTimes(1);
            expect(foundAResult).toBeTruthy();
        });
        it("should return false as he found no queue to purge", () => {
            const mq = new MessageQueue();
            const spyGet = jest.spyOn(mq.queues, "get");
            const foundAResult = mq.onPurge("fakeQueue");

            expect(mq.queues.size).toBe(0);
            expect(spyGet).toHaveBeenCalledTimes(1);
            expect(foundAResult).toBeFalsy();
        });
    });
    describe("dequeue", () => {
        it("should return if he does not find any elligible queue", () => {
            const mq = new MessageQueue();

            const mockedFnQueue = jest.spyOn(mq, "getElligibleQueue");
            mockedFnQueue.mockImplementationOnce(() => undefined);
            const mockedFnMessage = jest.spyOn(mq, "getElligibleMessage");
            mockedFnMessage.mockImplementationOnce(() => undefined);
            const mockedFnEmit = jest.spyOn(mq, "emit");

            mq.dequeue();
            expect(mockedFnQueue).toHaveBeenCalled();
            expect(mockedFnMessage).not.toHaveBeenCalled();
            expect(mockedFnEmit).not.toHaveBeenCalledWith("dequeue");
        });
        it("should emit to the 'dequeue' event, with a IQueueMessage as a payload", () => {
            const fakeMessage = {
                message: "WHOAMI",
                priority: 1,
                queue: "fakeQueue",
            };
            const fakeQueue = {
                delay: 1234,
                priority: 1,
                queue: [],
                sent_at: 0,
            };

            const mq = new MessageQueue();

            const mockedFnQueue = jest.spyOn(mq, "getElligibleQueue");
            mockedFnQueue.mockImplementationOnce(() => fakeQueue);
            const mockedFnMessage = jest.spyOn(mq, "getElligibleMessage");
            mockedFnMessage.mockImplementationOnce(() => fakeMessage);
            const mockedFnEmit = jest.spyOn(mq, "emit");

            mq.dequeue();
            expect(mockedFnQueue).toHaveBeenCalled();
            expect(mockedFnMessage).toHaveBeenCalledWith(fakeQueue);
            expect(mockedFnEmit).toHaveBeenCalledWith("dequeue", fakeMessage);
        });
    });
    describe("getElligibleMessage", () => {
        it("should have called orderByPriority with the queue as a parameter", () => {
            const messages = [
                {queue: "fakeQueue", priority: 10, message: "WHOAMI1"},
                {queue: "fakeQueue", priority: 1, message: "WHOAMI2"},
            ];
            const fakeQueue = {
                delay: 1234,
                priority: 1,
                queue: messages,
                sent_at: 0,
            };

            const mq = new MessageQueue();
            const mockedFn = jest.spyOn(mq, "orderByPriority");
            mockedFn.mockImplementationOnce((p) => p);

            mq.getElligibleMessage(fakeQueue);
            expect(mockedFn).toHaveBeenCalledWith(messages);
        });
        it("should shift the first message away and return it", () => {
            const messages = [
                {queue: "fakeQueue", priority: 10, message: "WHOAMI1"},
                {queue: "fakeQueue", priority: 1, message: "WHOAMI2"},
            ];
            const originalMessages = [...messages];
            const fakeQueue = {
                delay: 1234,
                priority: 1,
                queue: messages,
                sent_at: 0,
            };

            const mq = new MessageQueue();
            const elligibleMessage = mq.getElligibleMessage(fakeQueue);
            expect(elligibleMessage).toEqual(originalMessages[1]);
        });
        it("should have alterated the original queue instead of a copy", () => {
            const messages = [
                {queue: "fakeQueue", priority: 10, message: "WHOAMI1"},
                {queue: "fakeQueue", priority: 1, message: "WHOAMI2"},
            ];
            const originalMessages = [...messages];
            const fakeQueue = {
                delay: 1234,
                priority: 1,
                queue: messages,
                sent_at: 0,
            };

            const mq = new MessageQueue();
            mq.getElligibleMessage(fakeQueue);
            expect(messages.length).toBe(originalMessages.length - 1);
        });
    });
    describe("orderByPriority", () => {
        it("should sort the queue based on the priority", () => {
            const messages: IQueueMessage[] = [
                {queue: "fakeQueue", priority: 10, message: "WHOAMI1"},
                {queue: "fakeQueue", priority: 1, message: "WHOAMI2"},
                {queue: "fakeQueue", priority: 5, message: "WHOAMI3"},
                {queue: "fakeQueue", priority: 5, message: "WHOAMI4"},
            ];
            const originalCount = messages.length;
            const mq = new MessageQueue();
            const orderedArray = mq.orderByPriority(messages) as IQueueMessage[];
            expect(orderedArray[0].priority).toBe(1);
            expect(orderedArray[0].message).toBe("WHOAMI2");
            expect(orderedArray[1].priority).toBe(5);
            expect(orderedArray[1].message).toBe("WHOAMI3");
            expect(orderedArray[2].priority).toBe(5);
            expect(orderedArray[2].message).toBe("WHOAMI4");
            expect(orderedArray[3].priority).toBe(10);
            expect(orderedArray[3].message).toBe("WHOAMI1");
            expect(orderedArray.length).toBe(originalCount);
        });
        it("should alterate the queue when ordered", () => {
            const messages = [
                {queue: "fakeQueue", priority: 10, message: "WHOAMI1"},
                {queue: "fakeQueue", priority: 1, message: "WHOAMI2"},
                {queue: "fakeQueue", priority: 5, message: "WHOAMI3"},
                {queue: "fakeQueue", priority: 5, message: "WHOAMI4"},
            ];
            const mq = new MessageQueue();
            const orderedArray = mq.orderByPriority(messages)as IQueueMessage[];
            expect(orderedArray[0]).toEqual(messages[0]);
            expect(orderedArray[1]).toEqual(messages[1]);
            expect(orderedArray[2]).toEqual(messages[2]);
            expect(orderedArray[3]).toEqual(messages[3]);
            expect(orderedArray.length).toBe(messages.length);
        });
    });
    describe("getElligibleQueue", () => {
        it("should return undefined if no queue exists", () => {
            const mq = new MessageQueue();
            const foundQueue = mq.getElligibleQueue();
            expect(foundQueue).toBeUndefined();
        });
        it("should return undefined if the only queue has no valid delay", () => {
            const fakeQueue = {
                delay: 1250,
                priority: 1,
                queue: [],
                sent_at: Date.now() + 60000000,
            };
            const mq = new MessageQueue();
            mq.queues.set("fakeQueue", fakeQueue);
            const foundQueue = mq.getElligibleQueue();
            expect(foundQueue).toBeUndefined();
        });
        it("should return undefined if the only queue has no messages", () => {
            const fakeQueue = {
                delay: 1250,
                priority: 1,
                queue: [],
                sent_at: 0,
            };
            const mq = new MessageQueue();
            mq.queues.set("fakeQueue", fakeQueue);
            const foundQueue = mq.getElligibleQueue();
            expect(foundQueue).toBeUndefined();
        });
        it("should return the only queue if it is valid", () => {
            const messages = [
                {queue: "fakeQueue", priority: 10, message: "WHOAMI1"},
                {queue: "fakeQueue", priority: 1, message: "WHOAMI2"},
            ];
            const fakeQueue = {
                delay: 1250,
                priority: 1,
                queue: messages,
                sent_at: 0,
            };
            const mq = new MessageQueue();
            mq.queues.set("fakeQueue", fakeQueue);
            const foundQueue = mq.getElligibleQueue();
            expect(foundQueue).not.toBeUndefined();
            expect(foundQueue).toEqual(fakeQueue);
        });
        it("should give the queue with the highest priority", () => {
            const messages = [
                {queue: "fakeQueue", priority: 10, message: "WHOAMI1"},
                {queue: "fakeQueue", priority: 1, message: "WHOAMI2"},
            ];
            const expectedQueue = {
                delay: 1250,
                priority: 1,
                queue: messages,
                sent_at: 0,
            };
            const unexpectedQueue = {
                delay: 1250,
                priority: 2,
                queue: messages,
                sent_at: 0,
            };
            const mq = new MessageQueue();
            mq.queues.set("unexpected", unexpectedQueue);
            mq.queues.set("expected", expectedQueue);
            const foundQueue = mq.getElligibleQueue();
            expect(foundQueue).not.toBeUndefined();
            expect(foundQueue).toEqual(expectedQueue);
        });
        it("should give the queue with the latest sent_at if both have the same priority", () => {
            const messages = [
                {queue: "fakeQueue", priority: 10, message: "WHOAMI1"},
                {queue: "fakeQueue", priority: 1, message: "WHOAMI2"},
            ];
            const expectedQueue = {
                delay: 1250,
                priority: 1,
                queue: messages,
                sent_at: 10,
            };
            const unexpectedQueue1 = {
                delay: 1250,
                priority: 1,
                queue: messages,
                sent_at: 1314,
            };
            const unexpectedQueue2 = {
                delay: 1250,
                priority: 1,
                queue: messages,
                sent_at: 11111,
            };

            const mq = new MessageQueue();
            mq.queues.set("unexpected1", unexpectedQueue1);
            mq.queues.set("expected", expectedQueue);
            mq.queues.set("unexpected2", unexpectedQueue2);

            const foundQueue = mq.getElligibleQueue();
            expect(foundQueue).not.toBeUndefined();
            expect(foundQueue).toEqual(expectedQueue);
        });
    });
    describe("onStart", () => {
        it("should not retry to start if it is already started", () => {
            const mq = new MessageQueue();

            mq.enabled = true;
            mq.onStart();
        });
        it("should create a timeout and store it", () => {
            const mq = new MessageQueue();
            const mockedPoll = jest.spyOn(mq, "poll");
            mockedPoll.mockImplementation(() => undefined);
            jest.useFakeTimers();

            mq.onStart();

            expect(mq.interval).toBeDefined();
            jest.runOnlyPendingTimers();
            expect(setTimeout).toHaveBeenCalled();
            expect(mockedPoll).toHaveBeenCalled();
        });
        it("should set 'enabled' to true", () => {
            const mq = new MessageQueue();
            const mockedPoll = jest.spyOn(mq, "poll");
            mockedPoll.mockImplementation(() => undefined);
            jest.useFakeTimers();

            expect(mq.enabled).toBeFalsy();
            mq.onStart();
            expect(mq.enabled).toBeTruthy();
        });
    });
    describe("onStop", () => {
        it("should not stop if it is already stopped", () => {
            const mq = new MessageQueue();
            expect(mq.enabled).toBeFalsy();
            mq.onStop();
            expect(mq.enabled).toBeFalsy();
        });
        it("should set enabled to false", () => {
            const mq = new MessageQueue();
            mq.enabled = true;
            expect(mq.enabled).toBeTruthy();
            mq.onStop();
            expect(mq.enabled).toBeFalsy();
        });
    });
    describe("poll", () => {
        it("should not poll if it is not started", () => {
            const mq = new MessageQueue();
            const mockedFn = jest.spyOn(mq, "dequeue");
            mq.poll();
            expect(mockedFn).not.toHaveBeenCalled();
        });
        it("should call the dequeue method", () => {
            const mq = new MessageQueue();
            mq.enabled = true;
            const mockedFn = jest.spyOn(mq, "dequeue");
            mockedFn.mockImplementationOnce(() => undefined);
            mq.poll();
            expect(mockedFn).toHaveBeenCalled();
        });
        it("should set an interval and unref it", () => {
            const mq = new MessageQueue();
            mq.enabled = true;
            const mockedFnDequeue = jest.spyOn(mq, "dequeue");
            const mockedFnPoll = jest.spyOn(mq, "poll");
            mockedFnDequeue.mockImplementation(() => undefined);
            jest.useFakeTimers();
            mq.poll();
            mockedFnPoll.mockImplementation(() => undefined);
            expect(mq.interval).toBeDefined();
            jest.runOnlyPendingTimers();
            expect(mockedFnPoll).toHaveBeenCalled();
        });
    });
});
