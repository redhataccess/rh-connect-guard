'use strict';

module.exports.basic  = require('./mechanisms/basic');
module.exports.cookie = require('./mechanisms/cookie');
// module.exports.cert   = require('./mechanisms/cert');

module.exports.execChain = function (app, q, mechanisms) {
    mechanisms.forEach(function (Mechanism, i) {
        app.use(function (req, res, next) {
            var mechanism = new Mechanism(req, q.defer());
            console.log('doing ' + mechanism.getName());
            mechanism.tryAuth().then(function (ret) {

                if (ret.user === false) {
                    console.log(mechanism.name + " failed");
                    if (i === (mechanisms.length - 1)) {
                        console.log(mechanism.name + " was the last mechanism... giving up now");
                        return res.status(401).end();
                    }
                }

                if (ret.user !== mechanism.getSkipValue) {
                    req.authorized = ret.user;
                }

                return next();
            });

        });
    });
};

