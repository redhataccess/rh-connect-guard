'use strict';

var config = require('../config'),
    cache  = require('../cache'),
    pub    = {};


pub.log = {
    debug: function (msg) {
        if (msg && config.debug) {
            console.log(msg);
        }
    }
};

pub.checkCache = function (key, callback) {
    var user = cache.get(key, callback);
    if (user && user.authorized) {
        return user;
    }

    return false;
};

pub.alreadyAuthed = function (req) {
    return req.authorized;
};

pub.fail = function (deferred, msg) {
    pub.log.debug(msg);
    deferred.resolve({user: false, msg: msg});
    return deferred.promise;
};

pub.pass = function (deferred, user, msg) {
    pub.log.debug(msg);
    deferred.resolve({user: user, msg: msg});
    return deferred.promise;
};

pub.tryPassAndCache = function (deferred, cacheKey, user) {
    if (!user.authorized) {
        return pub.fail(deferred, 'user is missing an entitlement');
    }

    // if present add the cookie from upstream
    // if (apiResponse.headers['set-cookie']) {
    //     req.headers['set-cookie'] = apiResponse.headers['set-cookie'];
    // }

    pub.log.debug(user.authorized + " setting cache");

    // cache this  auth
    cache.set(cacheKey, user, function () {
        pub.pass(deferred, user, 'sucessful auth/cache for ' + user.login);
    });

    return deferred.promise;
};

module.exports = pub;
