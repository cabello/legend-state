import { doNotify } from './notify';
import { isFunction } from './is';
import {
    ListenerFn,
    NodeValue,
    ObservableChild,
    ObservableListenerDispose,
    ObservablePrimitiveFns,
    TrackingType,
} from './observableInterfaces';
import { onChange } from './onChange';
import { updateTracking } from './tracking';

export class ObservablePrimitiveClass<T = any> implements ObservablePrimitiveFns<T> {
    #node: NodeValue;
    [Symbol.iterator]; // This is for React to think it's a ReactNode

    constructor(node: NodeValue) {
        this.#node = node;
        this.set = this.set.bind(this);
    }
    // Getters
    peek(): T {
        const root = this.#node.root;
        if (root.activate) {
            root.activate();
            root.activate = undefined;
        }
        return root._;
    }
    get(): T {
        const node = this.#node;
        updateTracking(node);

        return this.peek();
    }
    // Setters
    set(value: T | ((prev: T) => T)): ObservableChild<T> {
        if (isFunction(value)) {
            value = value(this.#node.root._);
        }
        if (this.#node.root.locked) {
            throw new Error(
                process.env.NODE_ENV === 'development'
                    ? '[legend-state] Cannot modify an observable while it is locked. Please make sure that you unlock the observable before making changes.'
                    : '[legend-state] Modified locked observable'
            );
        }
        const root = this.#node.root;
        const prev = root._;
        root._ = value;
        doNotify(this.#node, value, [], value, prev, 0);
        return this as unknown as ObservableChild<T>;
    }
    // Listener
    onChange(cb: ListenerFn<T>, track?: TrackingType, noArgs?: boolean): ObservableListenerDispose {
        return onChange(this.#node, cb, track, noArgs);
    }
    /** @internal */
    getNode() {
        return this.#node;
    }
}
