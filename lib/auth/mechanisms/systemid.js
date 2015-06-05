'use strict';

var Mechanism = require('./mechanism'),
    request = require('request'),
    systemIdPropsArr = ['header', 'url', 'method'],
    missingProps = [],
    crypto = require('crypto'),
    parseString = require('xml2js').parseString;

var systemIdConfig = {};
systemIdPropsArr.forEach(function (prop) {
    var envName = 'SYSTEMIDAUTH_' + prop.toUpperCase();
    var envProp = process.env[envName];

    if (!envProp || envProp.trim() === '') {
        missingProps.push(envName);
    }
    systemIdConfig[prop] = envProp;
});

var Cert = function () {
    Mechanism.apply(this, arguments);
    this.name = 'SystemIdAuth';
    this.systemIdConfig = systemIdConfig;

    if (missingProps.length > 0) {
        missingProps.forEach(function (prop) {
            this.logger('Missing prop: ' + prop);
        }, this);
        throw Error('SystemIdAuth configuration not setup!');
    }
};

// Abstract glue
Cert.prototype = Object.create(Mechanism.prototype);
Cert.prototype.constructor = Cert;

// Must Impl
Cert.prototype.buildUserObject = function (account_number) {
    return {
        is_active: true,
        is_entitled: true,
        sso_username: 'systemid-system-' + account_number,
        account_number: account_number
    };
};

Cert.prototype.getCacheKey = function (creds) {
    return crypto.createHash('sha512').update(creds.systemid).digest('base64');
};

Cert.prototype.ensureCredentials = function (creds) {
    if (!creds) {
        throw new Error('Error getting headers');
    }

    if (!creds.systemid) {
        throw new Error('No System ID');
    }
};

Cert.prototype.getCreds = function () {
    return {
        systemid: this.req.headers[this.systemIdConfig.header]
    };
};

Cert.prototype.doRemoteCall = function (creds, callback) {
    var instance = this;
    request({
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml'
        },
        uri: this.systemIdConfig.url,
        body: buildXml(this.systemIdConfig, creds.systemid)
    }, function (err, res, body) {
        if (res.statusCode !== 200) {
            return instance.fail('Got a bad statusCode from rhn: ' + res.statusCode);
        }
        // explicitArray: true puts everything in an array, even if there is one element
        // makes the below check far nastier than it already is.
        parseString(body, {
            explicitArray: false
        }, function (err, result) {
            // Yucky.
            if (result && result.methodResponse &&
                result.methodResponse.params &&
                result.methodResponse.params.param &&
                result.methodResponse.params.param.value &&
                result.methodResponse.params.param.value.int) {
                callback(result.methodResponse.params.param.value.int);
            } else {
                instance.fail('Could not locate account number from xml response');
            }
        });

        return true;
    });
};

function encodeHTML(str) {
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function buildXml(config, systemid) {
    return '<?xml version=\'1.0\'?><methodCall><methodName>' + config.method + '</methodName><params><param><value><string>' + encodeHTML(systemid) + '</string></value></param></params></methodCall>';
}

module.exports = Cert;
