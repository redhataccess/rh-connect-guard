"use strict";

var Mechanism = require('./mechanism'),
    request = require('request'),
    crypto  = require('crypto'),
    priv    = {},
    basicAuthRegexp = /^Basic (.*)/;

var Basic = function () {
    Mechanism.apply(this, arguments);
    this.name = 'BasicAuth';
};

// Abstract glue
Basic.prototype = Object.create(Mechanism.prototype);
Basic.prototype.constructor = Basic;

// Must Impl

Basic.prototype.buildUserObject = function (body) {
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

Basic.prototype.getCacheKey = function (creds) {
    return crypto.createHash('sha512').update(creds).digest('base64');
};

Basic.prototype.ensureCredentials = function (creds) {
    if (!creds) {
        throw new Error('No Authorization header exists');
    }
};

Basic.prototype.getCreds = function () {
    var auth = this.req.get('authorization');
    if (auth && basicAuthRegexp.test(auth)) {
        return auth;
    }
    return false;
};

Basic.prototype.doRemoteCall = function (creds, callback) {
    // CALL STRATA
    request(this.getOpts(creds), function (err, res, body) {
        callback(body);
    });
};

Basic.prototype.getOpts = function (creds) {
    return {
        uri: this.config.basic_auth_url,
        strictSSL: this.config.request_options.strictSSL,
        headers: {
            accept: 'application/vnd.redhat.user+json',
            authorization: creds
        }
    };
};

// Methods

// Private functions

module.exports = Basic;

