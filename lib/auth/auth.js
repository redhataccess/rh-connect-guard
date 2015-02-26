'use strict';

function isLast(array, i) {
    if (i === (array.length  - 1)) {
        return true;
    }
    return false;
}

module.exports.basic  = require('./mechanisms/basic');
module.exports.cookie = require('./mechanisms/cookie');
// module.exports.cert   = require('./mechanisms/cert');

module.exports.execChain = function (app, q, mechanisms) {
    mechanisms.forEach(function (Mechanism, i) {
        app.use(function (req, res, next) {

            var mechanism = new Mechanism(req, q.defer());
            console.log('doing ' + mechanism.getName());

            try {
                mechanism.tryAuth().then(function (ret) {
                    if (ret.user !== mechanism.getSkipValue) {
                        req.authorized = ret.user;
                    }
                }).fail(function (e) {
                    console.log('TEST FAIL ' + e);
                }).catch(function (e) {
                    console.log('TEST FAIL ' + e);
                });
            } catch (e) {
                console.log(mechanism.name + " failed: " + e);
                if (isLast(mechanisms, i)) {
                    console.log(mechanism.name + " was the last mechanism... giving up now");
                    return res.status(401).end();
                }

            }
            return next();
        });
    });
};

