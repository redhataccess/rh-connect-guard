'use strict';
module.exports = function () {
    return function (req, res, next) {
        if (req.headers.host && req.headers.host !== 'access.redhat.com') {
            return res.redirect('https://access.redhat.com');
        }
        next();
    };
};
