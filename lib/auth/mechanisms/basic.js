'use strict';

var request = require('request'),
    config  = require('../config'),
    common  = require('./common'),
    cache   = require('../cache'),
    crypto  = require('crypto'),
    log     = common.log,
    pub     = {},
    priv    = {},
    basicAuthRegexp = /^Basic (.*)/;

pub.name = 'BasicAuth';

priv.getCacheKey = function (creds) {
    return crypto.createHash('sha512').update(creds).digest('base64');
};

priv.getCreds = function (req) {
    var auth = req.get('authorization');
    if (auth && basicAuthRegexp.test(auth)) {
        return auth;
    }
    return false;
};

priv.parseBasicAuthResponse = function (body) {
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
};


pub.tryAuth = function (req, deferred) {
    if (common.alreadyAuthed(req)) {
        return common.pass(deferred, 'SKIP', 'skipping');
    }

    var creds = priv.getCreds(req),
        opts  = {
            uri: config.basic_auth_url,
            headers: {
                accept: 'application/vnd.redhat.user+json',
                authorization: creds
            }
        };

    // EXIT IF NO AUTH HEADER
    if (!creds) {
        return common.fail(deferred, 'no auth headers exist');
    }

    // TRY CACHE
    var cacheKey = priv.getCacheKey(creds);
    cache.get(cacheKey, function (user) {

        if (user && user.authorized) {
            common.pass(deferred, user, 'got authed user from cache: ' + user.login);
            return;
        }

        // CALL STRATA
        request(opts, function (err, apiResponse, body) {
            common.tryPassAndCache(deferred, cacheKey, priv.parseBasicAuthResponse(body), req);
        });
    });

    return deferred.promise;
};

module.exports = pub;

