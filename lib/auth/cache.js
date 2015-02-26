'use strict';
var CACHE_TTL = 900;
var NodeCache = require('node-cache'),
    cache = new NodeCache({
        stdTTL: CACHE_TTL,
        checkperiod: 120
    });

var redis;
try {
    redis = require('redis');
} catch (e) {
    // noop. We tried.
}

// Super biased toward openshift... Could probably abstract this.
if (redis) {
    if (process.env.OPENSHIFT_REDIS_HOST) {
        cache = redis.createClient(process.env.OPENSHIFT_REDIS_PORT, process.env.OPENSHIFT_REDIS_HOST);
        cache.auth(process.env.REDIS_PASSWORD, function () {});
    } else if (process.env.OPENSHIFT_REDIS_DB_HOST) {
        cache = redis.createClient(process.env.OPENSHIFT_REDIS_DB_PORT, process.env.OPENSHIFT_REDIS_DB_HOST);
        cache.auth(process.env.OPENSHIFT_REDIS_DB_PASSWORD, function () {});
    } else {
        cache = redis.createClient();
    }
}

module.exports.set = function (key, val, cb) {
    if (redis) {
        return cache.set(key, JSON.stringify(val), function () {
            cache.expire(key, CACHE_TTL);
            cb();
        });
    }
    return cache.set(key, val, cb);
};

module.exports.get = function (key, cb) {
    cache.get(key, function (err, data) {
        if (redis && data) {
            return cb(JSON.parse(data));
        } else if (data && data[key]) {
            return cb(data[key]);
        } else {
            return cb();
        }
    });
};

