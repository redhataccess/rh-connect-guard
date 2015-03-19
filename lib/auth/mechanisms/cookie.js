"use strict";

var Mechanism = require('./mechanism'),
    request   = require('request'),
    config    = require('../config'),
    priv      = {};

var Cookie = function () {
    Mechanism.apply(this, arguments);
    this.name = 'CookieAuth';
};

// Abstract glue
Cookie.prototype = Object.create(Mechanism.prototype);
Cookie.prototype.constructor = Cookie;

// Must Impl

Cookie.prototype.buildUserObject = function (body) {
    try {
        return JSON.parse(body.substring(body.indexOf('({') + 1, body.indexOf('})') + 1));
    } catch (e) {
        return {};
    }
};

Cookie.prototype.getCacheKey = function (creds) {
    return creds.rh_sso;
};

Cookie.prototype.ensureCredentials = function (creds) {
    if (!creds) {
        throw new Error('Unable to get cookies');
    }

    if (!creds.rh_sso) {
        throw new Error('Missing rh_sso cookie');
    }

    if (!creds.rh_user) {
        throw new Error('Mssing rh_user cookie');
    }
};

Cookie.prototype.getCreds = function () {
    return this.req.cookies;
};

Cookie.prototype.doRemoteCall = function (creds, callback) {
    // CALL PORTAL
    request(this.getOpts(creds), function (err, res, body) {
        callback(body);
    });
};

Cookie.prototype.getOpts = function (creds) {
    return {
        uri: this.config.cookie_auth_url,
        strictSSL: this.config.request_options.strictSSL,
        jar: priv.getCookieJar(creds),
        headers: {
            accept: 'application/json'
        }
    };
};

// Methods

// Private functions

priv.getCookieJar = function (cookies) {
    var jar = request.jar();
    jar.setCookie(request.cookie('rh_sso=' + cookies.rh_sso), config.cookie_domain);
    jar.setCookie(request.cookie('rh_user=' + escape(cookies.rh_user)), config.cookie_domain);
    jar.setCookie(request.cookie('JSESSIONID=' + cookies.JSESSIONID), config.cookie_domain);
    return jar;
};

module.exports = Cookie;


