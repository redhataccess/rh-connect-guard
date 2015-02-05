'use strict';
module.exports = function () {
    return function (req, res, next) {
        var clientip = req.headers['x-client-ip'],
            forwardedIp = req.headers['x-forwarded-for'];
        if (forwardedIp) {
            // Get the last forwared-for ip
            forwardedIp = forwardedIp.split(', ').pop();
        }
        var internal = false;
        if (clientip && clientip.indexOf('10.') === 0) {
            internal = true;
        }
        // Double check the client-ip against the forwarded ip.
        if (internal && (forwardedIp && forwardedIp.indexOf('10.') !== 0)) {
            internal = false;
        }
        req.isInternalReq = internal;

        return next();
    };
};
