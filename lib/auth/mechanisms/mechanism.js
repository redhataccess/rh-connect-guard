"use strict";

var config = require('../config'),
    cache  = require('../cache'),
    priv   = {};

var Mechanism = function (req, deferred) {
        if (this.constructor == Mechanism) {
            throw new Error("Mechanism is the abstract class... you cant instantiate this");
        }

        this.req = req;
        this.deferred = deferred;
        this.config = config;
    };

// Concrete methods

Mechanism.prototype.getSkipValue = function () {
    return 'SKIP';
};

Mechanism.prototype.tryAuth = function () {
    var instance = this;

    if (priv.alreadyAuthed(instance.req)) {
        return priv.pass(instance.deferred, instance.getSkipValue(), 'skipping');
    }

    var creds = instance.getCreds(instance.req);

    // Pre flight test... exit early if not enough data
    try {
        instance.ensureCredentials(creds);
    } catch (e) {
        return priv.fail(e);
    }

    // Try the cache
    var cacheKey = instance.getCacheKey(creds);
    cache.get(cacheKey, function (user) {

        // Exit if the user was in cache
        if (user && user.authorized) {
            priv.pass(instance.deferred, user, 'got authed user from cache: ' + user.login);
            return;
        }

        instance.doRemoteCall(creds, function (data) {
            priv.tryPassAndCache(instance.deferred, cacheKey, instance.buildUserObject(data));
        });
    });

    return instance.deferred.promise;
};

Mechanism.prototype.getName = function () {
    return this.name;
};

// Private functions

priv.alreadyAuthed = function (req) {
    return req.authorized;
};

priv.tryPassAndCache = function (deferred, cacheKey, user) {
    if (!user) {
        return priv.fail(deferred, 'user null');
    }

    if (!user.authorized) {
        return priv.fail(deferred, 'user is missing an entitlement');
    }

    // if present add the cookie from upstream
    // if (apiResponse.headers['set-cookie']) {
    //     req.headers['set-cookie'] = apiResponse.headers['set-cookie'];
    // }

    priv.ldebug(user.authorized + " setting cache");

    // cache this  auth
    cache.set(cacheKey, user, function () {
        priv.pass(deferred, user, 'sucessful auth/cache for ' + user.login);
    });

    return deferred.promise;
};

priv.ldebug = function (msg) {
    if (msg && config.debug) {
        console.log(msg);
    }
};

priv.fail = function (deferred, msg) {
    priv.ldebug(msg);
    deferred.resolve({user: false, msg: msg});
    return deferred.promise;
};

priv.pass = function (deferred, user, msg) {
    priv.ldebug(msg);
    deferred.resolve({user: user, msg: msg});
    return deferred.promise;
};

// Abstract methods

Mechanism.prototype.buildUserObject = function () {
    throw new Error('Unimplemented method!');
};

Mechanism.prototype.getCacheKey = function () {
    throw new Error('Unimplemented method!');
};

Mechanism.prototype.ensureCredentials = function () {
    throw new Error('Unimplemented method!');
};

Mechanism.prototype.getCreds = function () {
    throw new Error('Unimplemented method!');
};

Mechanism.prototype.doRemoteCall = function () {
    throw new Error('Unimplemented method!');
};

module.exports = Mechanism;

