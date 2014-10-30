'use strict';

var request = require('request'),
    NodeCache = require('node-cache'),
    cache = new NodeCache({
        stdTTL: 600,
        checkperiod: 120
    }),
    config: {
        cookie_domain: process.env.COOKIE_AUTH_DOMAIN || 'https://access.redhat.com',
        cookie_auth_url: process.env.COOKIE_AUTH_URL || 'https://access.redhat.com/services/user/status?jsoncallback=',
    };

function authCheck(req, res, next) {
    var cookies = req.cookies;
    var cachedUserData = cache.get(cookies.rh_sso);
    if (cachedUserData) {
        req.authorized = cachedUserData;
        return next();
    }
    request({
        uri: config.cookie_auth_url,
        strictSSL: false,
        jar: _getJar(cookies)
    }, function(err, response, body) {
        try {
            var userData = JSON.parse(body.substring(body.indexOf('({') + 1, body.indexOf('})') + 1));
            if (userData.authorized) {
                req.authorized = userData;
                cache.set(cookies.rh_sso, userData);
            } else {
                req.authorized = false;
            }
        } catch (e) {
            req.authorized = false;
        }
        next();
    });
}

function _getJar(cookies) {
    var jar = request.jar();
    jar.setCookie(request.cookie('rh_sso=' + sso_cookie), config.cookie_domain);
    jar.setCookie(request.cookie('rh_user=' + escape(cookies.rh_user)), config.cookie_domain);
    jar.setCookie(request.cookie('JSESSIONID=' + cookies.JSESSIONID), config.cookie_domain);
    return jar;
}

module.exports = function() {
    return authCheck;
};
