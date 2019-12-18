import { EventEmitter } from "events";

/**
 * Describes a queue that is used to send messages.
 * This queue won't be fetched if the last time it
 * was sent is smaller than the allowed delay for
 * the queue.
 */
export interface IQueue {
    queue: IQueueMessage[];
    sent_at: number;
    delay: number;
    priority: number;
}
export interface IPriorityObject {
    priority: number;
}
/**
 * Used when creating a new queue using the event 'queue/set'.
 * This will create the queue if not existing yet (based on type),
 * or update the delay between two messages if it already exists.
 */
export interface IQueueCreationOptions {
    name: string;
    delay?: number;
    priority?: number;
}
/**
 * A message inside a IQueue.
 * a ASC order - lowest priority number first, highest last.
 */
export interface IQueueMessage {
    message: string;
    queue: string;
    priority: number;
}

export class MessageQueue extends EventEmitter {
    // Defaults for the class so that users can edit it
    /**
     * This is the default priority for queues that are not created yet but
     * are still receiving an enqueue request. Lower is better.
     */
    public static DEFAULT_QUEUE_PRIORITY: number = 100;
    /**
     * This is the default polling delay for the MessageQueue.
     * Units are milliseconds.
     */
    public static DEFAULT_QUEUE_POLLING_MS: number = 60;
    /**
     * This is the default delay between two messages to be sent for one specific queue.
     * Units are milliseconds.
     */
    public static DEFAULT_QUEUE_DELAY_MS: number = 1250;

    /**
     * Provides informations on whether the
     * MessageQueue is currently polling regularly or not.
     */
    public enabled: boolean = false;
    /**
     * Stores the NodeJS timer of the next polling.
     * This is used as a reference for an eventual cancellation.
     */
    public interval: NodeJS.Timer | undefined;
    /**
     * The duration between two pollings, in milliseconds.
     * This property can be updated and will be replicated
     * at start of the next cycle.
     */
    public pollingDelay: number = MessageQueue.DEFAULT_QUEUE_POLLING_MS;
    /**
     * A list of queues, which have a priority.
     * Allows the user to have multiple queues
     * that are more or less important.
     */
    public queues: Map<string, IQueue>;

    /**
     * Creates a new MessageQueue.
     * To start it, calling onStart() is mandatory.
     */
    constructor() {
        super();
        this.queues = new Map();
        this.on("enqueue", (message: IQueueMessage) => this.onEnqueue(message));
        this.on("remove", (queueName: string) => this.onRemove(queueName));
        this.on("purge", (queueName: string) => this.onPurge(queueName));
        this.on("start", () => this.onStart());
        this.on("stop", () => this.onStop());
    }
    public enqueue(message: IQueueMessage) {
       // Searching for the queue
       let foundQueue = this.queues.get(message.queue);
       if (!foundQueue) {
           // No queue matching the name, we create one
           // I'd like to "throw" here but sadly we are in a emit loop
           // Throwing would be context-less and useless.
           // Let's silently accept it and create a new queue
           foundQueue = {
               delay: MessageQueue.DEFAULT_QUEUE_DELAY_MS,
               priority: MessageQueue.DEFAULT_QUEUE_PRIORITY,
               queue: [],
               sent_at: 0,
           };
           this.queues.set(message.queue, foundQueue);
       }
       foundQueue.queue.push(message);
    }
    public onEnqueue(message: IQueueMessage) {
        this.enqueue(message);
    }
    public setQueue(queue: IQueueCreationOptions) {
        // Searching for the queue
        const foundQueue = this.queues.get(queue.name);
        if (!foundQueue) {
            // No queue matching the name, we create one
            this.queues.set(queue.name, {
                delay: queue.delay || MessageQueue.DEFAULT_QUEUE_DELAY_MS,
                priority: queue.priority || MessageQueue.DEFAULT_QUEUE_PRIORITY,
                queue: [],
                sent_at: 0,
            });
            return;
        }
        // We found the queue, we update the delay between two messages
        foundQueue.delay = queue.delay || foundQueue.delay;
        foundQueue.priority = queue.priority || foundQueue.priority;
    }
    public onRemove(queueName: string) {
        return this.queues.delete(queueName);
    }
    public onPurge(queueName: string) {
        const foundQueue = this.queues.get(queueName);
        if (!foundQueue) {
            return false;
        }
        foundQueue.queue = [];
        return true;
    }
    public onQueueSet(queue: IQueueCreationOptions) {
        this.setQueue(queue);
    }
    /**
     * Dequeues a message from the queues.
     * This will always return the one with the lowest priority first,
     * and will take into account the required delay between messages
     * for each queues.
     */
    public dequeue(): void {
        const elligibleQueue = this.getElligibleQueue();
        if (!elligibleQueue) {
            return;
        }
        const dequeuedMessage = this.getElligibleMessage(elligibleQueue);
        this.emit("dequeue", dequeuedMessage);
    }
    public orderByPriority(unorderedArray: IPriorityObject[]): IPriorityObject[] {
        return unorderedArray.sort((a, b) => {
            if (a.priority === b.priority) { return 0; }
            if (a.priority < b.priority) { return -1; }
            return 1;
        });
    }
    public getElligibleMessage(selectedQueue: IQueue): IQueueMessage | undefined {
        this.orderByPriority(selectedQueue.queue);
        const dequeuedMessage = selectedQueue.queue.shift();
        return dequeuedMessage;
    }
    public getElligibleQueue(): IQueue | undefined {
        const queueIterator = this.queues.values();
        const currentTimestamp = Date.now();
        let mostValuableQueue: IQueue | undefined;
        for (const queue of queueIterator) {
            const hasValidDelay = (queue.sent_at + queue.delay) < currentTimestamp;
            if (!hasValidDelay) {
                // Delay between two messages is invalid, we skip this one
                continue;
            } else if (!queue.queue.length) {
                // This queue is empty, we skip it
                continue;
            } else if (!mostValuableQueue) {
                // We do not have any queue ready yet, we assign this one by default
                mostValuableQueue = queue;
                continue;
            } else if (mostValuableQueue.priority > queue.priority) {
                mostValuableQueue = queue;
                continue;
            } else if (mostValuableQueue.sent_at > queue.sent_at) {
                // Found queue's last message was sent more time ago, we prioritize it
                mostValuableQueue = queue;
                continue;
            } else {
                continue;
            }
        }
        return mostValuableQueue;
    }
    public onStart() {
        if (this.enabled) {
            // Already enabled, skipping
            return;
        }
        this.interval = setTimeout(() => this.poll(), this.pollingDelay);
        this.interval.unref();
        this.enabled = true;
    }
    public onStop() {
        if (!this.enabled) {
            // Already disabled, skipping
            return;
        }
        this.enabled = false;
    }
    public poll() {
        if (!this.enabled) {
            return;
        }
        this.dequeue();
        this.interval = setTimeout(() => this.poll(), this.pollingDelay);
        this.interval.unref();
    }
}
