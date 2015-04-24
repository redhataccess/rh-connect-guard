'use strict';

var Q      = require('q'),
    debug  = require('debug')('rh:auth');

module.exports.basic  = require('./mechanisms/basic');
module.exports.cookie = require('./mechanisms/cookie');
module.exports.cert   = require('./mechanisms/cert');

module.exports.execChain = function (app, mechanisms) {
    mechanisms.forEach(function (Mechanism, i) {
        app.use(function (req, res, next) {
            var mechanism = new Mechanism(req, Q.defer());
            debug('doing ' + mechanism.getName());
            mechanism.tryAuth().then(function (ret) {

                if (ret.user === false) {
                    debug(mechanism.name + ' failed');
                    if (i === (mechanisms.length - 1)) {
                        debug(mechanism.name + ' was the last mechanism... giving up now');
                        return res.status(401).end();
                    }
                }

                if (ret.user !== mechanism.getSkipValue()) {
                    req.authorized = ret.user;
                }

                return next();
            });

        });
    });
};

