'use strict';
// Default Cache TTL is an hour -
// however each auth mechanism should probably set their own TTL
var CACHE_TTL = (60 * 60);
var NodeCache = require('node-cache'),
    cache = new NodeCache({
        stdTTL: CACHE_TTL,
        checkperiod: 120
    });

var isRedis = false;

module.exports.set = function (key, val, cb) {
    if (isRedis) {
        return cache.set(key, JSON.stringify(val), function () {
            cache.expire(key, CACHE_TTL);
            cb();
        });
    }
    return cache.set(key, val, cb);
};

module.exports.get = function (key, cb) {
    cache.get(key, function (err, data) {
        if (isRedis && data) {
            return cb(JSON.parse(data));
        } else if (data && data[key]) {
            return cb(data[key]);
        } else {
            return cb();
        }
    });
};

module.exports.updateClient = function (client, redis) {
    cache = client;
    isRedis = redis;
};
