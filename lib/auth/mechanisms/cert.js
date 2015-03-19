"use strict";

var Mechanism    = require('./mechanism'),
    request      = require('request'),
    config       = require('../config'),
    certPropsArr = ['commonNameHeader', 'issuerHeader', 'hostHeader', 'trustedIssuer', 'trustedHost', 'candlepinFindOwnerUrl'],
    missingProps = [],
    priv         = {};


var certConfig = {};
certPropsArr.forEach(function (prop) {
    var envName  = "CERTAUTH_" + prop.toUpperCase();
    var envProp = process.env[envName];

    if (!envProp || envProp.trim() === "") { // wtf I cant call priv.nullEmptyOrUndefined
        missingProps.push(envName);
    }
    certConfig[prop] = envProp;
});


var Cert = function () {
    Mechanism.apply(this, arguments);
    this.name = 'CertAuth';
    this.certConfig = certConfig;

    // Make cert auth blow up if someone tries to use it with missing props!
    if (missingProps.length > 0) {
        missingProps.forEach(function (prop) {
            console.log('Missing prop: ' + prop);
        });
        throw Error('CertAuth configuration not setup!');
    }
};

// Abstract glue
Cert.prototype = Object.create(Mechanism.prototype);
Cert.prototype.constructor = Cert;

// Must Impl

Cert.prototype.buildUserObject = function (json) {
    return {
        authorized: true,
        login: 'system-' + json.oracleAccountNumber,
        account_number: json.oracleAccountNumber
    }
};

Cert.prototype.getCacheKey = function (creds) {
    return creds.cn;
};

Cert.prototype.ensureCredentials = function (creds) {
    if (!creds) {
        throw new Error('Error getting headers');
    }
    //////////////
    // Host checks
    if (priv.nullEmptyOrUndefined(creds.host)) {
        throw new Error('Missing Host header');
    }

    if (creds.host !== this.certConfig.trustedHost) {
        throw new Error('Invalid host for cert auth. expected: ' + this.certConfig.trustedHost + ' actual: ' + creds.host);
    }

    ///////////
    // CN check
    if (priv.nullEmptyOrUndefined(creds.cn)) {
        throw new Error('Missing CommonName header');
    }

    ////////////////
    // Issuer checks
    if (priv.nullEmptyOrUndefined(creds.issuer)) {
        throw new Error('Missing Issuer header');
    }

    if (creds.issuer !== this.certConfig.trustedIssuer) {
        throw new Error('Invalid issuer');
    }
};

Cert.prototype.getCreds = function () {
    return {
        cn: priv.decodeCommonName(this.req.headers[this.certConfig.commonNameHeader]),
        issuer: priv.decodeIssuer(this.req.headers[this.certConfig.issuerHeader]),
        host: this.req.headers[this.certConfig.hostHeader]
    };
};

Cert.prototype.doRemoteCall = function (creds, callback) {
    var instance = this;
    request({
        headers: {
            accept: 'application/json'
        },
        uri: this.certConfig.candlepinFindOwnerUrl + creds.cn
    }, function (err, res, body) {
        var json;

        if (res.statusCode !== 200) {
            return instance.fail('Got a bad statusCode from CandlePin: ' + res.statusCode);
        }

        try {
            json = JSON.parse(body);
            callback(json);
        } catch (e) {
            return instance.fail('Unable to decode JSON from CandlePin: ' + e);
        }

        return true;
    });
};

// Methods


// Private functions

priv.decodeCommonName = function (str) {
    return unescape(str).replace("/CN=", "").trim();
};

priv.decodeIssuer = function (str) {
    return unescape(str).trim();
};

priv.nullEmptyOrUndefined = function (str) {
    return (!str || str.trim() === "");
};

module.exports = Cert;


