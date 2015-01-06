'use strict';
module.exports = function() {
    return function(req, res, next) {
        var clientip = req.headers['x-client-ip'],
            forwardedIp = req.headers['x-forwarded-for'];
        var internal = false;
        if ((clientip && clientip.indexOf('10.') === 0) && (forwardedIp && forwardedIp.indexOf('10.') === 0)) {
            internal = true;
        }
        if (internal) {
            return next();
        }
        res.status(401).end();
    };
};
