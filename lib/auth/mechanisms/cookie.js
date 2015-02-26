'use strict';

var request = require('request'),
    config  = require('../config'),
    common  = require('./common'),
    cache   = require('../cache'),
    log     = common.log,
    pub     = {},
    priv    = {};

pub.name = 'CookieAuth';

pub.tryAuth = function (req, deferred) {
    if (common.alreadyAuthed(req)) {
        return common.pass(deferred, 'SKIP', 'skipping');
    }

    var cookies  = req.cookies,
        httpOpts = {
            uri: config.cookie_auth_url,
            headers: {
                accept: 'application/json'
            }
        };

    // EXIT IF NO COOKIES
    if (!cookies.rh_sso) {
        return common.fail(deferred, 'missing rh_sso cookie') ;
    }

    if (!cookies.rh_user) {
        return common.fail(deferred, 'missing rh_user cookie') ;
    }

    // TRY CACHE
    cache.get(cookies.rh_sso, function (user) {
        if (user && user.authorized) {
            common.pass(deferred, user, 'got authed user from cache: ' + user.login);
            return;
        }

        // setup cookie jar
        httpOpts.jar = priv.getCookieJar(cookies);

        // CALL PORTAL
        request(httpOpts, function (err, apiResponse, body) {
            common.tryPassAndCache(deferred, cookies.rh_sso, priv.parseCookieAuthResponse(body));
        });
    });

    return deferred.promise;
};

priv.getCookieJar = function (cookies) {
    var jar = request.jar();
    jar.setCookie(request.cookie('rh_sso=' + cookies.rh_sso), config.cookie_domain);
    jar.setCookie(request.cookie('rh_user=' + escape(cookies.rh_user)), config.cookie_domain);
    jar.setCookie(request.cookie('JSESSIONID=' + cookies.JSESSIONID), config.cookie_domain);
    return jar;
};

priv.parseCookieAuthResponse = function (body) {
    return JSON.parse(body.substring(body.indexOf('({') + 1, body.indexOf('})') + 1));
};

module.exports = pub;
