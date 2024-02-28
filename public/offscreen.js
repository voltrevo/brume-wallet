/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./node_modules/@swc/helpers/esm/_class_apply_descriptor_get.js
function _class_apply_descriptor_get(receiver, descriptor) {
    if (descriptor.get) return descriptor.get.call(receiver);

    return descriptor.value;
}


;// CONCATENATED MODULE: ./node_modules/@swc/helpers/esm/_class_extract_field_descriptor.js
function _class_extract_field_descriptor(receiver, privateMap, action) {
    if (!privateMap.has(receiver)) throw new TypeError("attempted to " + action + " private field on non-instance");

    return privateMap.get(receiver);
}


;// CONCATENATED MODULE: ./node_modules/@swc/helpers/esm/_class_private_field_get.js



function _class_private_field_get(receiver, privateMap) {
    var descriptor = _class_extract_field_descriptor(receiver, privateMap, "get");
    return _class_apply_descriptor_get(receiver, descriptor);
}


;// CONCATENATED MODULE: ./node_modules/@swc/helpers/esm/_check_private_redeclaration.js
function _check_private_redeclaration(obj, privateCollection) {
    if (privateCollection.has(obj)) {
        throw new TypeError("Cannot initialize the same private elements twice on an object");
    }
}


;// CONCATENATED MODULE: ./node_modules/@swc/helpers/esm/_class_private_field_init.js


function _class_private_field_init(obj, privateMap, value) {
    _check_private_redeclaration(obj, privateMap);
    privateMap.set(obj, value);
}


;// CONCATENATED MODULE: ./node_modules/@swc/helpers/esm/_class_apply_descriptor_set.js
function _class_apply_descriptor_set(receiver, descriptor, value) {
    if (descriptor.set) descriptor.set.call(receiver, value);
    else {
        if (!descriptor.writable) {
            // This should only throw in strict mode, but class bodies are
            // always strict and private fields can only be used inside
            // class bodies.
            throw new TypeError("attempted to set read only private field");
        }
        descriptor.value = value;
    }
}


;// CONCATENATED MODULE: ./node_modules/@swc/helpers/esm/_class_private_field_set.js



function _class_private_field_set(receiver, privateMap, value) {
    var descriptor = _class_extract_field_descriptor(receiver, privateMap, "set");
    _class_apply_descriptor_set(receiver, descriptor, value);
    return value;
}


;// CONCATENATED MODULE: ./node_modules/@hazae41/result/dist/esm/mods/result/errors.mjs


class Unimplemented extends (/* unused pure expression or super */ null && (Error)) {
    #class = Unimplemented;
    name = this.#class.name;
    constructor(options) {
        super(`Something is not implemented`, options);
    }
}
class AssertError extends Error {
    #class = AssertError;
    name = this.#class.name;
    constructor(options) {
        super(`Some assertion failed`, options);
    }
}
class Panic extends Error {
    #class = Panic;
    name = this.#class.name;
    static from(cause) {
        return new Panic(`Something was not expected`, { cause });
    }
    static fromAndThrow(cause) {
        throw new Panic(`Something was not expected`, { cause });
    }
}
class Catched extends Error {
    #class = Catched;
    name = this.#class.name;
    constructor(options) {
        super(`Something has been catched`, options);
    }
    static from(cause) {
        return new Catched({ cause });
    }
    static fromAndThrow(cause) {
        throw new Catched({ cause });
    }
    /**
     * Throw if `Catched`, wrap in `Err` otherwise
     * @param error
     * @returns `Err(error)` if not `Catched`
     * @throws `error.cause` if `Catched`
     */
    static throwOrErr(error) {
        if (error instanceof Catched)
            throw error.cause;
        return new Err(error);
    }
}


//# sourceMappingURL=errors.mjs.map

;// CONCATENATED MODULE: ./node_modules/@hazae41/option/dist/esm/mods/option/option.mjs



var Option;
(function (Option) {
    function from(init) {
        if ("inner" in init)
            return new Some(init.inner);
        return new None();
    }
    Option.from = from;
    /**
     * Create an Option from a nullable value
     * @param inner
     * @returns `Some<T>` if `T`, `None` if `undefined`
     */
    function wrap(inner) {
        if (inner == null)
            return new None();
        return new Some(inner);
    }
    Option.wrap = wrap;
    async function map(inner, mapper) {
        return Option.wrap(inner).map(mapper).then(o => o.get());
    }
    Option.map = map;
    function mapSync(inner, mapper) {
        return Option.wrap(inner).mapSync(mapper).get();
    }
    Option.mapSync = mapSync;
    function unwrap(inner) {
        return Option.wrap(inner).unwrap();
    }
    Option.unwrap = unwrap;
})(Option || (Option = {}));


//# sourceMappingURL=option.mjs.map

;// CONCATENATED MODULE: ./node_modules/@hazae41/result/dist/esm/mods/result/result.mjs





var Result;
(function (Result) {
    Result.debug = false;
    /**
     * Create a Result from a maybe Error value
     * @param inner
     * @returns `Ok<T>` if `T`, `Err<Error>` if `Error`
     */
    function from(inner) {
        if (inner instanceof Error)
            return new Err(inner);
        else
            return new Ok(inner);
    }
    Result.from = from;
    /**
     * Create a Result from a boolean
     * @param value
     * @returns
     */
    function assert(value) {
        return value ? Ok.void() : new Err(new AssertError());
    }
    Result.assert = assert;
    function rewrap(wrapper) {
        try {
            return new Ok(wrapper.unwrap());
        }
        catch (error) {
            return new Err(error);
        }
    }
    Result.rewrap = rewrap;
    /**
     * Catch an Err thrown from Err.throw
     * @param callback
     * @param type
     * @returns `Ok<T>` if no `Err` was thrown, `Err<E>` otherwise
     * @see Err.throw
     */
    async function unthrow(callback) {
        let ref;
        try {
            return await callback((e) => ref = e);
        }
        catch (e) {
            if (ref !== undefined)
                return ref;
            throw e;
        }
    }
    Result.unthrow = unthrow;
    /**
     * Catch an Err thrown from Err.throw
     * @param callback
     * @param type
     * @returns `Ok<T>` if no `Err` was thrown, `Err<E>` otherwise
     * @see Err.throw
     */
    function unthrowSync(callback) {
        let ref;
        try {
            return callback((e) => ref = e);
        }
        catch (e) {
            if (ref !== undefined)
                return ref;
            throw e;
        }
    }
    Result.unthrowSync = unthrowSync;
    /**
     * Run a callback and wrap any returned value in Ok<T> and any thrown error in Err<unknown>
     * @param callback
     * @returns
     */
    async function runAndWrap(callback) {
        try {
            return new Ok(await callback());
        }
        catch (e) {
            return new Err(e);
        }
    }
    Result.runAndWrap = runAndWrap;
    /**
     * Run a callback and wrap any returned value in Ok<T> and any thrown error in Err<unknown>
     * @param callback
     * @returns
     */
    function runAndWrapSync(callback) {
        try {
            return new Ok(callback());
        }
        catch (e) {
            return new Err(e);
        }
    }
    Result.runAndWrapSync = runAndWrapSync;
    /**
     * Run a callback and wrap any returned value in Ok<T> and any thrown error in Err<Catched>
     * @param callback
     * @returns
     */
    async function runAndDoubleWrap(callback) {
        try {
            return new Ok(await callback());
        }
        catch (e) {
            return new Err(Catched.from(e));
        }
    }
    Result.runAndDoubleWrap = runAndDoubleWrap;
    /**
     * Run a callback and wrap any returned value in Ok<T> and any thrown error in Err<Catched>
     * @param callback
     * @returns
     */
    function runAndDoubleWrapSync(callback) {
        try {
            return new Ok(callback());
        }
        catch (e) {
            return new Err(Catched.from(e));
        }
    }
    Result.runAndDoubleWrapSync = runAndDoubleWrapSync;
    /**
     * Run a callback and wrap any thrown error in Err<unknown>
     * @param callback
     * @returns
     */
    async function runOrWrap(callback) {
        try {
            return await callback();
        }
        catch (e) {
            return new Err(e);
        }
    }
    Result.runOrWrap = runOrWrap;
    /**
     * Run a callback and wrap any thrown error in Err<unknown>
     * @param callback
     * @returns
     */
    function runOrWrapSync(callback) {
        try {
            return callback();
        }
        catch (e) {
            return new Err(e);
        }
    }
    Result.runOrWrapSync = runOrWrapSync;
    /**
     * Run a callback and wrap any thrown error in Err<unknown>
     * @param callback
     * @returns
     */
    async function runOrDoubleWrap(callback) {
        try {
            return await callback();
        }
        catch (e) {
            return new Err(Catched.from(e));
        }
    }
    Result.runOrDoubleWrap = runOrDoubleWrap;
    /**
     * Run a callback and wrap any thrown error in Err<unknown>
     * @param callback
     * @returns
     */
    function runOrDoubleWrapSync(callback) {
        try {
            return callback();
        }
        catch (e) {
            return new Err(Catched.from(e));
        }
    }
    Result.runOrDoubleWrapSync = runOrDoubleWrapSync;
    /**
     * Transform `Iterable<Result<T,E>` into `Result<Array<T>, E>`
     * @param iterable
     * @returns `Result<Array<T>, E>`
     */
    function all(iterable) {
        return collect(iterate(iterable));
    }
    Result.all = all;
    function maybeAll(iterable) {
        return maybeCollect(maybeIterate(iterable));
    }
    Result.maybeAll = maybeAll;
    /**
     * Transform `Iterable<Result<T,E>` into `Iterator<T, Result<void, E>>`
     * @param iterable
     * @returns `Iterator<T, Result<void, E>>`
     */
    function* iterate(iterable) {
        for (const result of iterable) {
            if (result.isOk())
                yield result.get();
            else
                return result;
        }
        return Ok.void();
    }
    Result.iterate = iterate;
    function* maybeIterate(iterable) {
        for (const result of iterable) {
            if (result == null)
                return result;
            else if (result.isOk())
                yield result.get();
            else
                return result;
        }
        return Ok.void();
    }
    Result.maybeIterate = maybeIterate;
    /**
     * Transform `Iterator<T, Result<void, E>>` into `Result<Array<T>, E>`
     * @param iterator `Result<Array<T>, E>`
     */
    function collect(iterator) {
        const array = new Array();
        let result = iterator.next();
        for (; !result.done; result = iterator.next())
            array.push(result.value);
        return result.value.set(array);
    }
    Result.collect = collect;
    function maybeCollect(iterator) {
        const array = new Array();
        let result = iterator.next();
        for (; !result.done; result = iterator.next())
            array.push(result.value);
        return Option.mapSync(result.value, result => result.set(array));
    }
    Result.maybeCollect = maybeCollect;
})(Result || (Result = {}));


//# sourceMappingURL=result.mjs.map

;// CONCATENATED MODULE: ./node_modules/@hazae41/result/dist/esm/mods/result/err.mjs




class Err {
    #inner;
    #timeout;
    /**
     * A failure
     * @param inner
     */
    constructor(inner) {
        this.#inner = inner;
        if (!Result.debug)
            return;
        const error = new Error(`An Err has not been handled properly`);
        this.#timeout = setTimeout(() => { throw error; }, 1000);
    }
    /**
     * Create an empty `Err`
     * @returns `Err(void)`
     */
    static void() {
        return new Err(undefined);
    }
    /**
     * Create an `Err`
     * @param inner
     * @returns `Err(inner)`
     */
    static new(inner) {
        return new Err(inner);
    }
    /**
     * Create an `Err` with an `Error` inside
     * @param message
     * @param options
     * @returns `Err<Error>`
     */
    static error(message, options) {
        return new Err(new Error(message, options));
    }
    get inner() {
        return this.#inner;
    }
    /**
     * Set this result as handled
     */
    ignore() {
        if (!this.#timeout)
            return this;
        clearTimeout(this.#timeout);
        this.#timeout = undefined;
        return this;
    }
    /**
     * Type guard for `Ok`
     * @returns `true` if `Ok`, `false` if `Err`
     */
    isOk() {
        return false;
    }
    /**
     * Returns true if the result is `Ok` and the value inside of it matches a predicate
     * @param okPredicate
     * @returns `true` if `Ok` and `await okPredicate(this.inner)`, `false` otherwise
     */
    async isOkAnd(okPredicate) {
        return false;
    }
    /**
     * Returns true if the result is `Ok` and the value inside of it matches a predicate
     * @param okPredicate
     * @returns `true` if `Ok` and `await okPredicate(this.inner)`, `false` otherwise
     */
    isOkAndSync(okPredicate) {
        return false;
    }
    /**
     * Type guard for `Err`
     * @returns `true` if `Err`, `false` if `Ok`
     */
    isErr() {
        return true;
    }
    /**
     * Returns true if the result is `Err` and the value inside of it matches a predicate
     * @param errPredicate
     * @returns `true` if `Err` and `await errPredicate(this.inner)`, `false` otherwise
     */
    async isErrAnd(errPredicate) {
        return await errPredicate(this.inner);
    }
    /**
     * Returns true if the result is `Err` and the value inside of it matches a predicate
     * @param errPredicate
     * @returns `true` if `Err` and `await errPredicate(this.inner)`, `false` otherwise
     */
    isErrAndSync(errPredicate) {
        return errPredicate(this.inner);
    }
    /**
     * Compile-time safely get Ok's inner type
     * @returns `this.inner`
     * @throws if `this` is `Err`
     */
    get() {
        throw new Panic();
    }
    /**
     * Compile-time safely get Err's inner type
     * @returns `this.inner`
     * @throws if `this` is `Ok`
     */
    getErr() {
        this.ignore();
        return this.inner;
    }
    /**
     * Transform `Result<T, E>` into `Option<T>`
     * @returns `Some(this.inner)` if `Ok`, `None` if `Err`
     */
    ok() {
        this.ignore();
        return new None();
    }
    /**
     * Transform `Result<T, E>` into `Option<E>`
     * @returns `Some(this.inner)` if `Err`, `None` if `Ok`
     */
    err() {
        this.ignore();
        return new Some(this.inner);
    }
    /**
     * Returns an iterator over the possibly contained value
     * @yields `this.inner` if `Ok`
     */
    *[Symbol.iterator]() {
        this.ignore();
        return;
    }
    /**
     * Transform `Result<T,E>` into `[T,E]`
     * @returns `[this.inner, undefined]` if `Ok`, `[undefined, this.inner]` if `Err`
     */
    split() {
        this.ignore();
        return [undefined, this.inner];
    }
    /**
     * Returns true if the result is an `Ok` value containing the given value
     * @param value
     * @returns `true` if `Ok` and `this.inner === value`, `false` otherwise
     */
    contains(value) {
        return false;
    }
    /**
     * Returns true if the result is an `Err` value containing the given value
     * @param value
     * @returns `true` if `Err` and `this.inner === value`, `false` otherwise
     */
    containsErr(value) {
        return this.inner === value;
    }
    /**
     * Get the inner value or throw to the closest `Result.unthrow`
     * @param thrower The thrower from `Result.unthrow`
     * @returns `this.inner` if `Ok`
     * @throws `undefined` if `Err`
     * @see Result.unthrow
     * @see Result.unthrowSync
     */
    throw(thrower) {
        thrower(this);
        throw this;
    }
    /**
     * Get the inner value or throw the inner error wrapped inside another Error
     * @param message
     * @returns `this.inner` if `Ok`, `Error(message, { cause: this.inner })` if `Err`
     */
    expect(message) {
        this.ignore();
        throw new Error(message, { cause: this.inner });
    }
    /**
     * Get the inner error or throw the inner value wrapped inside another Error
     * @param message
     * @returns `this.inner` if `Err`, `Error(message, { cause: this.inner })` if `Ok`
     */
    expectErr(message) {
        this.ignore();
        return this.inner;
    }
    /**
     * Get the inner value or panic
     * @returns `this.inner` if `Ok`
     * @throws `this.inner` if `Err`
     */
    unwrap() {
        this.ignore();
        throw this.inner;
    }
    /**
     * Get the inner error or panic
     * @returns `this.inner` if `Err`
     * @throws `this.inner` if `Ok`
     */
    unwrapErr() {
        this.ignore();
        return this.inner;
    }
    /**
     * Get the inner value or a default one
     * @param value
     * @returns `this.inner` if `Ok`, `value` if `Err`
     */
    unwrapOr(value) {
        this.ignore();
        return value;
    }
    /**
     * Get the inner value or compute a default one from the inner error
     * @param errMapper
     * @returns `this.inner` if `Ok`, `await errMapper(this.inner)` if `Err`
     * @throws if `await errMapper(this.inner)` throws
     */
    async unwrapOrElse(errMapper) {
        this.ignore();
        return await errMapper(this.inner);
    }
    /**
     * Get the inner value or compute a default one from the inner error
     * @param errMapper
     * @returns `this.inner` if `Ok`, `errMapper(this.inner)` if `Err`
     * @throws if `errMapper(this.inner)` throws
     */
    unwrapOrElseSync(errMapper) {
        this.ignore();
        return errMapper(this.inner);
    }
    /**
     * Transform Result<Promise<T>, E> into Promise<Result<T, E>>
     * @returns `await this.inner` if `Ok`, `this` if `Err`
     */
    async await() {
        return this;
    }
    /**
     * Transform Result<T, Promise<E>> into Promise<Result<T, E>>
     * @returns `await this.inner` if `Err`, `this` if `Ok`
     */
    async awaitErr() {
        return new Err(await this.inner);
    }
    /**
     * Transform Result<Promise<T>, Promise<E>> into Promise<Result<T, E>>
     * @returns `await this.inner`
     */
    async awaitAll() {
        return await this.awaitErr();
    }
    /**
     * Transform `Result<T, E>` into `Result<void, E>`
     * @returns `Ok<void>` if `Ok<T>`, `Err<E>` if `E<E>`
     */
    clear() {
        return this;
    }
    /**
     * Transform `Result<T, E>` into `Result<T, void>`
     * @returns `Ok<T>` if `Ok<T>`, `Err<void>` if `E<E>`
     */
    clearErr() {
        this.ignore();
        return Err.void();
    }
    /**
     * Calls the given callback with the inner value if `Ok`
     * @param okCallback
     * @returns `this`
     */
    async inspect(okCallback) {
        return this;
    }
    /**
     * Calls the given callback with the inner value if `Ok`
     * @param okCallback
     * @returns `this`
     */
    inspectSync(okCallback) {
        return this;
    }
    /**
     * Calls the given callback with the inner value if `Err`
     * @param errCallback
     * @returns `this`
     */
    async inspectErr(errCallback) {
        await errCallback(this.inner);
        return this;
    }
    /**
     * Calls the given callback with the inner value if `Err`
     * @param errCallback
     * @returns `this`
     */
    inspectErrSync(errCallback) {
        errCallback(this.inner);
        return this;
    }
    /**
     * Return a new `Ok` but with the given `inner`
     * @param inner
     * @returns `Ok(inner)` if `Ok`, `this` if `Err`
     */
    set(inner) {
        return this;
    }
    /**
     * Return a new `Err` but with the given `inner`
     * @param inner
     * @returns `Err(inner)` if `Err`, `this` if `Ok`
     */
    setErr(inner) {
        return new Err(inner);
    }
    /**
     * Map the inner value into another
     * @param okMapper
     * @returns `Ok(await okMapper(this.inner))` if `Ok`, `this` if `Err`
     * @throws if `await okMapper(this.inner)` throws
     */
    async map(okMapper) {
        return this;
    }
    /**
     * Map the inner value into another
     * @param okMapper
     * @returns `Ok(okMapper(this.inner))` if `Ok`, `this` if `Err`
     * @throws if `okMapper(this.inner)` throws
     */
    mapSync(okMapper) {
        return this;
    }
    /**
     * Map the inner error into another
     * @param errMapper
     * @returns `Err(await errMapper(this.inner))` if `Err`, `this` if `Ok`
     * @throws if `await errMapper(this.inner)` throws
     */
    async mapErr(errMapper) {
        this.ignore();
        return new Err(await errMapper(this.inner));
    }
    /**
     * Map the inner error into another
     * @param errMapper
     * @returns `Err(errMapper(this.inner))` if `Err`, `this` if `Ok`
     * @throws if `errMapper(this.inner)` throws
     */
    mapErrSync(errMapper) {
        this.ignore();
        return new Err(errMapper(this.inner));
    }
    /**
     * Map the inner value into another, or a default one
     * @param value
     * @param okMapper
     * @returns `await okMapper(this.inner)` if `Ok`, `value` if `Err`
     * @throws if `await okMapper(this.inner)` throws
     */
    async mapOr(value, okMapper) {
        this.ignore();
        return value;
    }
    /**
     * Map the inner value into another, or a default one
     * @param value
     * @param okMapper
     * @returns `okMapper(this.inner)` if `Ok`, `value` if `Err`
     * @throws if `okMapper(this.inner)` throws
     */
    mapOrSync(value, okMapper) {
        this.ignore();
        return value;
    }
    /**
     * Map the inner value into another, or a default one
     * @param errMapper
     * @param okMapper
     * @returns `await okMapper(this.inner)` if `Ok`, `await errMapper(this.inner)` if `Err`
     * @throws if `await okMapper(this.inner)` or `await errMapper(this.inner)` throws
     */
    async mapOrElse(errMapper, okMapper) {
        this.ignore();
        return await errMapper(this.inner);
    }
    /**
     * Map the inner value into another, or a default one
     * @param errMapper
     * @param okMapper
     * @returns `okMapper(this.inner)` if `Ok`, `errMapper(this.inner)` if `Err`
     * @throws if `okMapper(this.inner)` or `errMapper(this.inner)` throws
     */
    mapOrElseSync(errMapper, okMapper) {
        this.ignore();
        return errMapper(this.inner);
    }
    /**
     * Return `value` if `Ok`, return `this` if `Err`
     * @param value
     * @returns `value` if `Ok`, `this` if `Err`
     */
    and(value) {
        return this;
    }
    /**
     * Return `await okMapper(this.inner)` if `Ok`, return `this` if `Err`
     * @param okMapper
     * @returns `await okMapper(this.inner)` if `Ok`, `this` if `Err`
     * @throws if `await okMapper(this.inner)` throws
     */
    async andThen(okMapper) {
        return this;
    }
    /**
     * Return `okMapper(this.inner)` if `Ok`, return `this` if `Err`
     * @param okMapper
     * @returns `okMapper(this.inner)` if `Ok`, `this` if `Err`
     * @throws if `okMapper(this.inner)` throws
     */
    andThenSync(okMapper) {
        return this;
    }
    /**
     * Return `value` if `Err`, return `this` if `Ok`
     * @param value
     * @returns `value` if `Err`, `this` if `Ok`
     */
    or(value) {
        this.ignore();
        return value;
    }
    /**
     * Return `await errMapper(this.inner)` if `Err`, return `this` if `Ok`
     * @param errMapper
     * @returns `await errMapper(this.inner)` if `Err`, `this` if `Ok`
     * @throws if `await errMapper(this.inner)` throws
     */
    async orElse(errMapper) {
        this.ignore();
        return await errMapper(this.inner);
    }
    /**
     * Return `errMapper(this.inner)` if `Err`, return `this` if `Ok`
     * @param errMapper
     * @returns `errMapper(this.inner)` if `Err`, `this` if `Ok`
     * @throws if `errMapper(this.inner)` throws
     */
    orElseSync(errMapper) {
        this.ignore();
        return errMapper(this.inner);
    }
    /**
     * Transform Result<Result<T, E1>, E2> into Result<T, E1 | E2>
     * @param result
     * @returns `this` if `Err`, `this.inner` if `Ok`
     */
    flatten() {
        return this;
    }
}


//# sourceMappingURL=err.mjs.map

;// CONCATENATED MODULE: ./node_modules/@hazae41/option/dist/esm/mods/option/none.mjs


class NoneError extends Error {
    constructor() {
        super(`Option is a None`);
    }
}
class None {
    inner;
    /**
     * An empty value
     */
    constructor(inner = undefined) {
        this.inner = inner;
    }
    /**
     * Create a `None`
     * @returns `None`
     */
    static new() {
        return new None();
    }
    static from(init) {
        return new None();
    }
    /**
     * Type guard for `Some`
     * @returns `true` if `Some`, `false` if `None`
     */
    isSome() {
        return false;
    }
    /**
     * Returns `true` if the option is a `Some` and the value inside of it matches a predicate
     * @param somePredicate
     * @returns `true` if `Some` and `await somePredicate(this.inner)`, `None` otherwise
     */
    async isSomeAnd(somePredicate) {
        return false;
    }
    /**
     * Returns `true` if the option is a `Some` and the value inside of it matches a predicate
     * @param somePredicate
     * @returns `true` if `Some` and `somePredicate(this.inner)`, `None` otherwise
     */
    isSomeAndSync(somePredicate) {
        return false;
    }
    /**
     * Type guard for `None`
     * @returns `true` if `None`, `false` if `Some`
     */
    isNone() {
        return true;
    }
    /**
     * Compile-time safely get `this.inner`
     * @returns `this.inner`
     */
    get() {
        return this.inner;
    }
    /**
     * Returns an iterator over the possibly contained value
     * @yields `this.inner` if `Some`
     */
    *[Symbol.iterator]() {
        return;
    }
    /**
     * Get the inner value if `Some`, throw `Error(message)` otherwise
     * @param message
     * @returns `this.inner` if `Some`
     * @throws `Error(message)` if `None`
     */
    expect(message) {
        throw new Error(message);
    }
    /**
     * Get the inner value or throw a NoneError
     * @returns `this.inner` if `Some`
     * @throws `NoneError` if `None`
     */
    unwrap() {
        throw new Error(`A None has been unwrapped`);
    }
    /**
     * Get the inner value or a default one
     * @param value
     * @returns `this.inner` if `Some`, `value` if `None`
     */
    unwrapOr(value) {
        return value;
    }
    /**
     * Returns the contained `Some` value or computes it from a closure
     * @param noneCallback
     * @returns `this.inner` if `Some`, `await noneCallback()` if `None`
     */
    async unwrapOrElse(noneCallback) {
        return await noneCallback();
    }
    /**
     * Returns the contained `Some` value or computes it from a closure
     * @param noneCallback
     * @returns `this.inner` if `Some`, `noneCallback()` if `None`
     */
    unwrapOrElseSync(noneCallback) {
        return noneCallback();
    }
    /**
     * Transform `Option<T>` into `Result<T, NoneError>`
     * @returns `Ok(this.inner)` if `Some`, `Err(NoneError)` if `None`
     */
    ok() {
        return new Err(new NoneError());
    }
    /**
     * Transform `Option<T>` into `Result<T, E>`
     * @param error
     * @returns `Ok(this.inner)` if `Some`, `Err(error)` if `None`
     */
    okOr(error) {
        return new Err(error);
    }
    /**
     * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err())`
     * @param noneCallback
     * @returns `Ok(this.inner)` if `Some`, `Err(await noneCallback())` is `None`
     */
    async okOrElse(noneCallback) {
        return new Err(await noneCallback());
    }
    /**
     * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err())`
     * @param noneCallback
     * @returns `Ok(this.inner)` if `Some`, `Err(noneCallback())` is `None`
     */
    okOrElseSync(noneCallback) {
        return new Err(noneCallback());
    }
    /**
     * Returns `None` if the option is `None`, otherwise calls `somePredicate` with the wrapped value
     * @param somePredicate
     * @returns `Some` if `Some` and `await somePredicate(this.inner)`, `None` otherwise
     */
    async filter(somePredicate) {
        return this;
    }
    /**
     * Returns `None` if the option is `None`, otherwise calls `somePredicate` with the wrapped value
     * @param somePredicate
     * @returns `Some` if `Some` and `somePredicate(this.inner)`, `None` otherwise
     */
    filterSync(somePredicate) {
        return this;
    }
    /**
     * Transform `Option<Promise<T>>` into `Promise<Option<T>>`
     * @returns `Promise<Option<T>>`
     */
    async await() {
        return this;
    }
    /**
     * Returns `true` if the option is a `Some` value containing the given value
     * @param value
     * @returns `true` if `Some` and `this.inner === value`, `None` otherwise
     */
    contains(value) {
        return false;
    }
    /**
     * Calls the given callback with the inner value if `Ok`
     * @param someCallback
     * @returns `this`
     */
    async inspect(someCallback) {
        return this;
    }
    /**
     * Calls the given callback with the inner value if `Ok`
     * @param someCallback
     * @returns `this`
     */
    inspectSync(someCallback) {
        return this;
    }
    /**
     * Maps an `Option<T>` to `Option<U>` by applying a function to a contained value (if `Some`) or returns `None` (if `None`)
     * @param someMapper
     * @returns `Some(await someMapper(this.inner))` if `Some`, `this` if `None`
     */
    async map(someMapper) {
        return this;
    }
    /**
     * Maps an `Option<T>` to `Option<U>` by applying a function to a contained value (if `Some`) or returns `None` (if `None`)
     * @param someMapper
     * @returns `Some(someMapper(this.inner))` if `Some`, `this` if `None`
     */
    mapSync(someMapper) {
        return this;
    }
    /**
     * Returns the provided default result (if none), or applies a function to the contained value (if any)
     * @param value
     * @param someMapper
     * @returns `value` if `None`, `await someMapper(this.inner)` if `Some`
     */
    async mapOr(value, someMapper) {
        return value;
    }
    /**
     * Returns the provided default result (if none), or applies a function to the contained value (if any)
     * @param value
     * @param someMapper
     * @returns `value` if `None`, `someMapper(this.inner)` if `Some`
     */
    mapOrSync(value, someMapper) {
        return value;
    }
    /**
     * Computes a default function result (if none), or applies a different function to the contained value (if any)
     * @param noneCallback
     * @param someMapper
     * @returns `await someMapper(this.inner)` if `Some`, `await noneCallback()` if `None`
     */
    async mapOrElse(noneCallback, someMapper) {
        return await noneCallback();
    }
    /**
     * Computes a default function result (if none), or applies a different function to the contained value (if any)
     * @param noneCallback
     * @param someMapper
     * @returns `someMapper(this.inner)` if `Some`, `noneCallback()` if `None`
     */
    mapOrElseSync(noneCallback, someMapper) {
        return noneCallback();
    }
    /**
     * Returns `None` if the option is `None`, otherwise returns `value`
     * @param value
     * @returns `None` if `None`, `value` if `Some`
     */
    and(value) {
        return this;
    }
    /**
     * Returns `None` if the option is `None`, otherwise calls `someMapper` with the wrapped value and returns the result
     * @param someMapper
     * @returns `None` if `None`, `await someMapper(this.inner)` if `Some`
     */
    async andThen(someMapper) {
        return this;
    }
    /**
     * Returns `None` if the option is `None`, otherwise calls `someMapper` with the wrapped value and returns the result
     * @param someMapper
     * @returns `None` if `None`, `someMapper(this.inner)` if `Some`
     */
    andThenSync(someMapper) {
        return this;
    }
    /**
     * Returns `this` if `Some`, otherwise returns `value`
     * @param value
     * @returns `this` if `Some`, `value` if `None`
     */
    or(value) {
        return value;
    }
    /**
     * Returns `this` if `Some`, otherwise calls `noneCallback` and returns the result
     * @param noneCallback
     * @returns `this` if `Some`, `await noneCallback()` if `None`
     */
    async orElse(noneCallback) {
        return await noneCallback();
    }
    /**
     * Returns `this` if `Some`, otherwise calls `noneCallback` and returns the result
     * @param noneCallback
     * @returns `this` if `Some`, `noneCallback()` if `None`
     */
    orElseSync(noneCallback) {
        return noneCallback();
    }
    /**
     * Returns `Some` if exactly one of the options is `Some`, otherwise returns `None`
     * @param value
     * @returns `None` if both are `Some` or both are `None`, the only `Some` otherwise
     */
    xor(value) {
        return value;
    }
    /**
     * Zips `this` with another `Option`
     * @param other
     * @returns `Some([this.inner, other.inner])` if both are `Some`, `None` if one of them is `None`
     */
    zip(other) {
        return this;
    }
}


//# sourceMappingURL=none.mjs.map

;// CONCATENATED MODULE: ./node_modules/@hazae41/option/dist/esm/mods/option/some.mjs



class Some {
    inner;
    /**
     * An existing value
     * @param inner
     */
    constructor(inner) {
        this.inner = inner;
    }
    /**
     * Create a `Some`
     * @param inner
     * @returns `Some(inner)`
     */
    static new(inner) {
        return new Some(inner);
    }
    static from(init) {
        return new Some(init.inner);
    }
    /**
     * Type guard for `Some`
     * @returns `true` if `Some`, `false` if `None`
     */
    isSome() {
        return true;
    }
    /**
     * Returns `true` if the option is a `Some` and the value inside of it matches a predicate
     * @param somePredicate
     * @returns `true` if `Some` and `await somePredicate(this.inner)`, `None` otherwise
     */
    async isSomeAnd(somePredicate) {
        return await somePredicate(this.inner);
    }
    /**
     * Returns `true` if the option is a `Some` and the value inside of it matches a predicate
     * @param somePredicate
     * @returns `true` if `Some` and `somePredicate(this.inner)`, `None` otherwise
     */
    isSomeAndSync(somePredicate) {
        return somePredicate(this.inner);
    }
    /**
     * Type guard for `None`
     * @returns `true` if `None`, `false` if `Some`
     */
    isNone() {
        return false;
    }
    /**
     * Compile-time safely get `this.inner`
     * @returns `this.inner`
     */
    get() {
        return this.inner;
    }
    /**
     * Returns an iterator over the possibly contained value
     * @yields `this.inner` if `Some`
     */
    *[Symbol.iterator]() {
        yield this.inner;
    }
    /**
     * Get the inner value if `Some`, throw `Error(message)` otherwise
     * @param message
     * @returns `this.inner` if `Some`
     * @throws `Error(message)` if `None`
     */
    expect(message) {
        return this.inner;
    }
    /**
     * Get the inner value or throw a NoneError
     * @returns `this.inner` if `Some`
     * @throws `NoneError` if `None`
     */
    unwrap() {
        return this.inner;
    }
    /**
     * Get the inner value or a default one
     * @param value
     * @returns `this.inner` if `Some`, `value` if `None`
     */
    unwrapOr(value) {
        return this.inner;
    }
    /**
     * Returns the contained `Some` value or computes it from a closure
     * @param noneCallback
     * @returns `this.inner` if `Some`, `await noneCallback()` if `None`
     */
    async unwrapOrElse(noneCallback) {
        return this.inner;
    }
    /**
     * Returns the contained `Some` value or computes it from a closure
     * @param noneCallback
     * @returns `this.inner` if `Some`, `noneCallback()` if `None`
     */
    unwrapOrElseSync(noneCallback) {
        return this.inner;
    }
    /**
     * Transform `Option<T>` into `Result<T, NoneError>`
     * @returns `Ok(this.inner)` if `Some`, `Err(NoneError)` if `None`
     */
    ok() {
        return new Ok(this.inner);
    }
    /**
     * Transform `Option<T>` into `Result<T, E>`
     * @param error
     * @returns `Ok(this.inner)` if `Some`, `Err(error)` if `None`
     */
    okOr(error) {
        return new Ok(this.inner);
    }
    /**
     * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err())`
     * @param noneCallback
     * @returns `Ok(this.inner)` if `Some`, `Err(await noneCallback())` is `None`
     */
    async okOrElse(noneCallback) {
        return new Ok(this.inner);
    }
    /**
     * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err())`
     * @param noneCallback
     * @returns `Ok(this.inner)` if `Some`, `Err(noneCallback())` is `None`
     */
    okOrElseSync(noneCallback) {
        return new Ok(this.inner);
    }
    /**
     * Returns `None` if the option is `None`, otherwise calls `somePredicate` with the wrapped value
     * @param somePredicate
     * @returns `Some` if `Some` and `await somePredicate(this.inner)`, `None` otherwise
     */
    async filter(somePredicate) {
        if (await somePredicate(this.inner))
            return this;
        else
            return new None();
    }
    /**
     * Returns `None` if the option is `None`, otherwise calls `somePredicate` with the wrapped value
     * @param somePredicate
     * @returns `Some` if `Some` and `somePredicate(this.inner)`, `None` otherwise
     */
    filterSync(somePredicate) {
        if (somePredicate(this.inner))
            return this;
        else
            return new None();
    }
    /**
     * Transform `Option<Promise<T>>` into `Promise<Option<T>>`
     * @returns `Promise<Option<T>>`
     */
    async await() {
        return new Some(await this.inner);
    }
    /**
     * Returns `true` if the option is a `Some` value containing the given value
     * @param value
     * @returns `true` if `Some` and `this.inner === value`, `None` otherwise
     */
    contains(value) {
        return this.inner === value;
    }
    /**
     * Calls the given callback with the inner value if `Ok`
     * @param someCallback
     * @returns `this`
     */
    async inspect(someCallback) {
        await someCallback(this.inner);
        return this;
    }
    /**
     * Calls the given callback with the inner value if `Ok`
     * @param someCallback
     * @returns `this`
     */
    inspectSync(someCallback) {
        someCallback(this.inner);
        return this;
    }
    /**
     * Maps an `Option<T>` to `Option<U>` by applying a function to a contained value (if `Some`) or returns `None` (if `None`)
     * @param someMapper
     * @returns `Some(await someMapper(this.inner))` if `Some`, `this` if `None`
     */
    async map(someMapper) {
        return new Some(await someMapper(this.inner));
    }
    /**
     * Maps an `Option<T>` to `Option<U>` by applying a function to a contained value (if `Some`) or returns `None` (if `None`)
     * @param someMapper
     * @returns `Some(someMapper(this.inner))` if `Some`, `this` if `None`
     */
    mapSync(someMapper) {
        return new Some(someMapper(this.inner));
    }
    /**
     * Returns the provided default result (if none), or applies a function to the contained value (if any)
     * @param value
     * @param someMapper
     * @returns `value` if `None`, `await someMapper(this.inner)` if `Some`
     */
    async mapOr(value, someMapper) {
        return await someMapper(this.inner);
    }
    /**
     * Returns the provided default result (if none), or applies a function to the contained value (if any)
     * @param value
     * @param someMapper
     * @returns `value` if `None`, `someMapper(this.inner)` if `Some`
     */
    mapOrSync(value, someMapper) {
        return someMapper(this.inner);
    }
    /**
     * Computes a default function result (if none), or applies a different function to the contained value (if any)
     * @param noneCallback
     * @param someMapper
     * @returns `await someMapper(this.inner)` if `Some`, `await noneCallback()` if `None`
     */
    async mapOrElse(noneCallback, someMapper) {
        return await someMapper(this.inner);
    }
    /**
     * Computes a default function result (if none), or applies a different function to the contained value (if any)
     * @param noneCallback
     * @param someMapper
     * @returns `someMapper(this.inner)` if `Some`, `noneCallback()` if `None`
     */
    mapOrElseSync(noneCallback, someMapper) {
        return someMapper(this.inner);
    }
    /**
     * Returns `None` if the option is `None`, otherwise returns `value`
     * @param value
     * @returns `None` if `None`, `value` if `Some`
     */
    and(value) {
        return value;
    }
    /**
     * Returns `None` if the option is `None`, otherwise calls `someMapper` with the wrapped value and returns the result
     * @param someMapper
     * @returns `None` if `None`, `await someMapper(this.inner)` if `Some`
     */
    async andThen(someMapper) {
        return await someMapper(this.inner);
    }
    /**
     * Returns `None` if the option is `None`, otherwise calls `someMapper` with the wrapped value and returns the result
     * @param someMapper
     * @returns `None` if `None`, `someMapper(this.inner)` if `Some`
     */
    andThenSync(someMapper) {
        return someMapper(this.inner);
    }
    /**
     * Returns `this` if `Some`, otherwise returns `value`
     * @param value
     * @returns `this` if `Some`, `value` if `None`
     */
    or(value) {
        return this;
    }
    /**
     * Returns `this` if `Some`, otherwise calls `noneCallback` and returns the result
     * @param noneCallback
     * @returns `this` if `Some`, `await noneCallback()` if `None`
     */
    async orElse(noneCallback) {
        return this;
    }
    /**
     * Returns `this` if `Some`, otherwise calls `noneCallback` and returns the result
     * @param noneCallback
     * @returns `this` if `Some`, `noneCallback()` if `None`
     */
    orElseSync(noneCallback) {
        return this;
    }
    /**
     * Returns `Some` if exactly one of the options is `Some`, otherwise returns `None`
     * @param value
     * @returns `None` if both are `Some` or both are `None`, the only `Some` otherwise
     */
    xor(value) {
        if (value.isSome())
            return new None();
        else
            return this;
    }
    /**
     * Zips `this` with another `Option`
     * @param other
     * @returns `Some([this.inner, other.inner])` if both are `Some`, `None` if one of them is `None`
     */
    zip(other) {
        if (other.isSome())
            return new Some([this.inner, other.inner]);
        else
            return other;
    }
}


//# sourceMappingURL=some.mjs.map

;// CONCATENATED MODULE: ./node_modules/@hazae41/result/dist/esm/mods/result/ok.mjs




class Ok {
    #inner;
    #timeout;
    /**
     * A success
     * @param inner
     */
    constructor(inner) {
        this.#inner = inner;
        if (!Result.debug)
            return;
        const error = new Error(`An Ok has not been handled properly`);
        this.#timeout = setTimeout(() => { throw error; }, 1000);
    }
    /**
     * Create an empty `Ok`
     * @returns `Ok(void)`
     */
    static void() {
        return new Ok(undefined);
    }
    /**
     * Create an `Ok`
     * @param inner
     * @returns `Ok(inner)`
     */
    static new(inner) {
        return new Ok(inner);
    }
    get inner() {
        return this.#inner;
    }
    /**
     * Set this result as handled
     */
    ignore() {
        if (!this.#timeout)
            return this;
        clearTimeout(this.#timeout);
        this.#timeout = undefined;
        return this;
    }
    /**
     * Type guard for `Ok`
     * @returns `true` if `Ok`, `false` if `Err`
     */
    isOk() {
        return true;
    }
    /**
     * Returns true if the result is `Ok` and the value inside of it matches a predicate
     * @param okPredicate
     * @returns `true` if `Ok` and `await okPredicate(this.inner)`, `false` otherwise
     */
    async isOkAnd(okPredicate) {
        return await okPredicate(this.inner);
    }
    /**
     * Returns true if the result is `Ok` and the value inside of it matches a predicate
     * @param okPredicate
     * @returns `true` if `Ok` and `await okPredicate(this.inner)`, `false` otherwise
     */
    isOkAndSync(okPredicate) {
        return okPredicate(this.inner);
    }
    /**
     * Type guard for `Err`
     * @returns `true` if `Err`, `false` if `Ok`
     */
    isErr() {
        return false;
    }
    /**
     * Returns true if the result is `Err` and the value inside of it matches a predicate
     * @param errPredicate
     * @returns `true` if `Err` and `await errPredicate(this.inner)`, `false` otherwise
     */
    async isErrAnd(errPredicate) {
        return false;
    }
    /**
     * Returns true if the result is `Err` and the value inside of it matches a predicate
     * @param errPredicate
     * @returns `true` if `Err` and `await errPredicate(this.inner)`, `false` otherwise
     */
    isErrAndSync(errPredicate) {
        return false;
    }
    /**
     * Compile-time safely get Ok's inner type
     * @returns `this.inner`
     * @throws if `this` is `Err`
     */
    get() {
        this.ignore();
        return this.inner;
    }
    /**
     * Compile-time safely get Err's inner type
     * @returns `this.inner`
     * @throws if `this` is `Ok`
     */
    getErr() {
        throw new Panic();
    }
    /**
     * Transform `Result<T, E>` into `Option<T>`
     * @returns `Some(this.inner)` if `Ok`, `None` if `Err`
     */
    ok() {
        this.ignore();
        return new Some(this.inner);
    }
    /**
     * Transform `Result<T, E>` into `Option<E>`
     * @returns `Some(this.inner)` if `Err`, `None` if `Ok`
     */
    err() {
        this.ignore();
        return new None();
    }
    /**
     * Returns an iterator over the possibly contained value
     * @yields `this.inner` if `Ok`
     */
    *[Symbol.iterator]() {
        this.ignore();
        yield this.inner;
    }
    /**
     * Transform `Result<T,E>` into `[T,E]`
     * @returns `[this.inner, undefined]` if `Ok`, `[undefined, this.inner]` if `Err`
     */
    split() {
        this.ignore();
        return [this.inner, undefined];
    }
    /**
     * Returns true if the result is an `Ok` value containing the given value
     * @param value
     * @returns `true` if `Ok` and `this.inner === value`, `false` otherwise
     */
    contains(value) {
        return this.inner === value;
    }
    /**
     * Returns true if the result is an `Err` value containing the given value
     * @param value
     * @returns `true` if `Err` and `this.inner === value`, `false` otherwise
     */
    containsErr(value) {
        return false;
    }
    /**
     * Just like `unwrap` but it throws to the closest `Result.unthrow`
     * @returns `this.inner` if `Ok`
     * @throws `this` if `Err`
     * @see Result.unthrow
     * @see Result.unthrowSync
     */
    throw(thrower) {
        this.ignore();
        return this.inner;
    }
    /**
     * Get the inner value or throw the inner error wrapped inside another Error
     * @param message
     * @returns `this.inner` if `Ok`, `Error(message, { cause: this.inner })` if `Err`
     */
    expect(message) {
        this.ignore();
        return this.inner;
    }
    /**
     * Get the inner error or throw the inner value wrapped inside another Error
     * @param message
     * @returns `this.inner` if `Err`, `Error(message, { cause: this.inner })` if `Ok`
     */
    expectErr(message) {
        this.ignore();
        throw new Error(message, { cause: this.inner });
    }
    /**
     * Get the inner value or panic
     * @returns `this.inner` if `Ok`
     * @throws `this.inner` if `Err`
     */
    unwrap() {
        this.ignore();
        return this.inner;
    }
    /**
     * Get the inner error or panic
     * @returns `this.inner` if `Err`
     * @throws `this.inner` if `Ok`
     */
    unwrapErr() {
        this.ignore();
        throw this.inner;
    }
    /**
     * Get the inner value or a default one
     * @param value
     * @returns `this.inner` if `Ok`, `value` if `Err`
     */
    unwrapOr(value) {
        this.ignore();
        return this.inner;
    }
    /**
     * Get the inner value or compute a default one from the inner error
     * @param errMapper
     * @returns `this.inner` if `Ok`, `await errMapper(this.inner)` if `Err`
     * @throws if `await errMapper(this.inner)` throws
     */
    async unwrapOrElse(errMapper) {
        this.ignore();
        return this.inner;
    }
    /**
     * Get the inner value or compute a default one from the inner error
     * @param errMapper
     * @returns `this.inner` if `Ok`, `errMapper(this.inner)` if `Err`
     * @throws if `errMapper(this.inner)` throws
     */
    unwrapOrElseSync(errMapper) {
        this.ignore();
        return this.inner;
    }
    /**
     * Transform Result<Promise<T>, E> into Promise<Result<T, E>>
     * @returns `await this.inner` if `Ok`, `this` if `Err`
     */
    async await() {
        return new Ok(await this.inner);
    }
    /**
     * Transform Result<T, Promise<E>> into Promise<Result<T, E>>
     * @returns `await this.inner` if `Err`, `this` if `Ok`
     */
    async awaitErr() {
        return this;
    }
    /**
     * Transform Result<Promise<T>, Promise<E>> into Promise<Result<T, E>>
     * @returns `await this.inner`
     */
    async awaitAll() {
        return await this.await();
    }
    /**
     * Transform `Result<T, E>` into `Result<void, E>`
     * @returns `Ok<void>` if `Ok<T>`, `Err<E>` if `E<E>`
     */
    clear() {
        this.ignore();
        return Ok.void();
    }
    /**
     * Transform `Result<T, E>` into `Result<T, void>`
     * @returns `Ok<T>` if `Ok<T>`, `Err<void>` if `E<E>`
     */
    clearErr() {
        return this;
    }
    /**
     * Calls the given callback with the inner value if `Ok`
     * @param okCallback
     * @returns `this`
     */
    async inspect(okCallback) {
        await okCallback(this.inner);
        return this;
    }
    /**
     * Calls the given callback with the inner value if `Ok`
     * @param okCallback
     * @returns `this`
     */
    inspectSync(okCallback) {
        okCallback(this.inner);
        return this;
    }
    /**
     * Calls the given callback with the inner value if `Err`
     * @param errCallback
     * @returns `this`
     */
    async inspectErr(errCallback) {
        return this;
    }
    /**
     * Calls the given callback with the inner value if `Err`
     * @param errCallback
     * @returns `this`
     */
    inspectErrSync(errCallback) {
        return this;
    }
    /**
     * Return a new `Ok` but with the given `inner`
     * @param inner
     * @returns `Ok(inner)` if `Ok`, `this` if `Err`
     */
    set(inner) {
        return new Ok(inner);
    }
    /**
     * Return a new `Err` but with the given `inner`
     * @param inner
     * @returns `Err(inner)` if `Err`, `this` if `Ok`
     */
    setErr(inner) {
        return this;
    }
    /**
     * Map the inner value into another
     * @param okMapper
     * @returns `Ok(await okMapper(this.inner))` if `Ok`, `this` if `Err`
     * @throws if `await okMapper(this.inner)` throws
     */
    async map(okMapper) {
        this.ignore();
        return new Ok(await okMapper(this.inner));
    }
    /**
     * Map the inner value into another
     * @param okMapper
     * @returns `Ok(okMapper(this.inner))` if `Ok`, `this` if `Err`
     * @throws if `okMapper(this.inner)` throws
     */
    mapSync(okMapper) {
        this.ignore();
        return new Ok(okMapper(this.inner));
    }
    /**
     * Map the inner error into another
     * @param errMapper
     * @returns `Err(await errMapper(this.inner))` if `Err`, `this` if `Ok`
     * @throws if `await errMapper(this.inner)` throws
     */
    async mapErr(errMapper) {
        return this;
    }
    /**
     * Map the inner error into another
     * @param errMapper
     * @returns `Err(errMapper(this.inner))` if `Err`, `this` if `Ok`
     * @throws if `errMapper(this.inner)` throws
     */
    mapErrSync(errMapper) {
        return this;
    }
    /**
     * Map the inner value into another, or a default one
     * @param value
     * @param okMapper
     * @returns `await okMapper(this.inner)` if `Ok`, `value` if `Err`
     * @throws if `await okMapper(this.inner)` throws
     */
    async mapOr(value, okMapper) {
        this.ignore();
        return await okMapper(this.inner);
    }
    /**
     * Map the inner value into another, or a default one
     * @param value
     * @param okMapper
     * @returns `okMapper(this.inner)` if `Ok`, `value` if `Err`
     * @throws if `okMapper(this.inner)` throws
     */
    mapOrSync(value, okMapper) {
        this.ignore();
        return okMapper(this.inner);
    }
    /**
     * Map the inner value into another, or a default one
     * @param errMapper
     * @param okMapper
     * @returns `await okMapper(this.inner)` if `Ok`, `await errMapper(this.inner)` if `Err`
     * @throws if `await okMapper(this.inner)` or `await errMapper(this.inner)` throws
     */
    async mapOrElse(errMapper, okMapper) {
        this.ignore();
        return await okMapper(this.inner);
    }
    /**
     * Map the inner value into another, or a default one
     * @param errMapper
     * @param okMapper
     * @returns `okMapper(this.inner)` if `Ok`, `errMapper(this.inner)` if `Err`
     * @throws if `okMapper(this.inner)` or `errMapper(this.inner)` throws
     */
    mapOrElseSync(errMapper, okMapper) {
        this.ignore();
        return okMapper(this.inner);
    }
    /**
     * Return `value` if `Ok`, return `this` if `Err`
     * @param value
     * @returns `value` if `Ok`, `this` if `Err`
     */
    and(value) {
        this.ignore();
        return value;
    }
    /**
     * Return `await okMapper(this.inner)` if `Ok`, return `this` if `Err`
     * @param okMapper
     * @returns `await okMapper(this.inner)` if `Ok`, `this` if `Err`
     * @throws if `await okMapper(this.inner)` throws
     */
    async andThen(okMapper) {
        this.ignore();
        return await okMapper(this.inner);
    }
    /**
     * Return `okMapper(this.inner)` if `Ok`, return `this` if `Err`
     * @param okMapper
     * @returns `okMapper(this.inner)` if `Ok`, `this` if `Err`
     * @throws if `okMapper(this.inner)` throws
     */
    andThenSync(okMapper) {
        this.ignore();
        return okMapper(this.inner);
    }
    /**
     * Return `value` if `Err`, return `this` if `Ok`
     * @param value
     * @returns `value` if `Err`, `this` if `Ok`
     */
    or(value) {
        return this;
    }
    /**
     * Return `await errMapper(this.inner)` if `Err`, return `this` if `Ok`
     * @param errMapper
     * @returns `await errMapper(this.inner)` if `Err`, `this` if `Ok`
     * @throws if `await errMapper(this.inner)` throws
     */
    async orElse(errMapper) {
        return this;
    }
    /**
     * Return `errMapper(this.inner)` if `Err`, return `this` if `Ok`
     * @param errMapper
     * @returns `errMapper(this.inner)` if `Err`, `this` if `Ok`
     * @throws if `errMapper(this.inner)` throws
     */
    orElseSync(errMapper) {
        return this;
    }
    /**
     * Transform Result<Result<T, E1>, E2> into Result<T, E1 | E2>
     * @param result
     * @returns `this` if `Err`, `this.inner` if `Ok`
     */
    flatten() {
        return this.inner;
    }
}


//# sourceMappingURL=ok.mjs.map

;// CONCATENATED MODULE: ./src/libs/browser/browser.ts



var _a;

var _ref, _ref1;
const browser = (_ref1 = (_ref = null) !== null && _ref !== void 0 ? _ref : globalThis.browser) !== null && _ref1 !== void 0 ? _ref1 : globalThis.chrome;
var _class = /*#__PURE__*/ new WeakMap();
class BrowserError extends Error {
    static from(cause) {
        return new _a(undefined, {
            cause
        });
    }
    static async runOrThrow(callback) {
        try {
            const result = await callback();
            if (browser.runtime.lastError) throw browser.runtime.lastError;
            return result;
        } catch (e) {
            throw _a.from(e);
        }
    }
    static runOrThrowSync(callback) {
        try {
            const result = callback();
            if (browser.runtime.lastError) throw browser.runtime.lastError;
            return result;
        } catch (e) {
            throw _a.from(e);
        }
    }
    static async tryRun(callback) {
        try {
            const result = await callback();
            if (browser.runtime.lastError) throw browser.runtime.lastError;
            return new Ok(result);
        } catch (e) {
            return new Err(_a.from(e));
        }
    }
    static tryRunSync(callback) {
        try {
            const result = callback();
            if (browser.runtime.lastError) throw browser.runtime.lastError;
            return new Ok(result);
        } catch (e) {
            return new Err(_a.from(e));
        }
    }
    constructor(...args){
        super(...args);
        _class_private_field_init(this, _class, {
            writable: true,
            value: void 0
        });
        _class_private_field_set(this, _class, _a);
        this.name = _class_private_field_get(this, _class).name;
    }
}
_a = BrowserError;

;// CONCATENATED MODULE: ./src/mods/background/offscreen/index.ts

const background = browser.runtime.connect({
    name: "offscreen->background"
});

/******/ })()
;