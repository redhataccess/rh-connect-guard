'use strict';

var request = require('request'),
    crypto = require('crypto'),
    basicAuthRegexp = /^Basic (.*)/,
    cache = require('./cache'),
    config = {
        cookie_domain: process.env.COOKIE_AUTH_DOMAIN || 'https://access.redhat.com',
        cookie_auth_url: process.env.COOKIE_AUTH_URL || 'https://access.redhat.com/services/user/status?jsoncallback=',
        basic_auth_url: process.env.BASIC_AUTH_URL || 'https://access.redhat.com/rs/users/current'
    };


function doCheck(req, res, next, basic) {
    var cookies = req.cookies;
    var reqOpts = {
        uri: config.cookie_auth_url,
        strictSSL: false,
        headers: {
            'Accept': 'application/json'
        }
    };
    if (basic) {
        reqOpts.uri = config.basic_auth_url;
        reqOpts.headers.Authorization = basic;
        reqOpts.headers.Accept = 'application/vnd.redhat.user+json';
    } else {
        reqOpts.jar = _getJar(cookies);
    }
    request(reqOpts, function (err, response, body) {
        var userData = {};
        if (basic) {
            userData = parseBasicAuthResponse(body);
        } else {
            try {
                userData = JSON.parse(body.substring(body.indexOf('({') + 1, body.indexOf('})') + 1));
            } catch (e) {
                req.authorized = false;
            }
        }

        if (userData.authorized) {
            req.authorized = userData;
            if (response.headers['set-cookie']) {
                req.headers['set-cookie'] = response.headers['set-cookie'];
            }
            return cache.set(getCacheKey(basic, cookies.rh_sso), userData, next);
        } else {
            req.authorized = false;
        }

        next();
    });
}

function parseBasicAuthResponse(body) {
    var data;
    try {
        data = JSON.parse(body);
    } catch (e) {
        return {};
    }
    return {
        authorized: true,
        internal: data.is_internal,
        login: data.sso_username,
        user_id: data.id,
        account_id: data.org_id,
        account_number: data.account_number,
        email: data.email,
        name: data.first_name + ' ' + data.last_name
    };
}

function isBasic(req) {
    var auth = req.get('authorization');
    if (auth && basicAuthRegexp.test(auth)) {
        return auth;
    }
    return false;
}

function getCacheKey(basic, rh_sso) {
    if (basic) {
        return crypto.createHash('sha512').update(basic).digest('base64');
    }
    return rh_sso;
}

function authCheck(req, res, next) {
    var basic = isBasic(req);
    var cookies = req.cookies;
    if (!basic && (!cookies.rh_sso || !cookies.rh_user)) {
        req.authorized = false;
        return next();
    }
    if (basic || cookies.rh_sso) {
        cache.get(getCacheKey(basic, cookies.rh_sso), function (user) {
            if (user && user.authorized) {
                req.authorized = user;
                return next();
            }
            doCheck(req, res, next, basic);
        });
    } else {
        doCheck(req, res, next, basic);
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
