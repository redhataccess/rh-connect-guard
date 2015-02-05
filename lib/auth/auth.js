'use strict';

var request = require('request'),
    cache = require('./cache'),
    config = {
        cookie_domain: process.env.COOKIE_AUTH_DOMAIN || 'https://access.redhat.com',
        cookie_auth_url: process.env.COOKIE_AUTH_URL || 'https://access.redhat.com/services/user/status?jsoncallback=',
    };

function doCheck(req, res, next) {
    var cookies = req.cookies;
    request({
        uri: config.cookie_auth_url,
        strictSSL: false,
        jar: _getJar(cookies)
    }, function (err, response, body) {
        try {
            var userData = JSON.parse(body.substring(body.indexOf('({') + 1, body.indexOf('})') + 1));
            if (userData.authorized) {
                req.authorized = userData;
                if (response.headers['set-cookie']) {
                    req.headers['set-cookie'] = response.headers['set-cookie'];
                }
                return cache.set(cookies.rh_sso, userData, next);
            } else {
                req.authorized = false;
            }
        } catch (e) {
            req.authorized = false;
        }
        next();
    });
}

function authCheck(req, res, next) {
    var cookies = req.cookies;
    if (!cookies.rh_sso || !cookies.rh_user) {
        req.authorized = false;
        return next();
    }
    if (cookies.rh_sso) {
        cache.get(cookies.rh_sso, function (user) {
            if (user && user.authorized) {
                req.authorized = user;
                return next();
            }
            doCheck(req, res, next);
        });
    } else {
        doCheck(req, res, next);
    }
}

function _getJar(cookies) {
    var jar = request.jar();
    jar.setCookie(request.cookie('rh_sso=' + cookies.rh_sso), config.cookie_domain);
    jar.setCookie(request.cookie('rh_user=' + escape(cookies.rh_user)), config.cookie_domain);
    jar.setCookie(request.cookie('JSESSIONID=' + cookies.JSESSIONID), config.cookie_domain);
    return jar;
}

module.exports = function () {
    return authCheck;
};
