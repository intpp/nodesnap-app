'use strict';

var queryString = require('querystring'),
    formData = require('form-data');

var Api = function (options) {
    var that = this;

    that.initialized = false;
    that.options = options || {};

    if (that.options.domain === undefined) {
        console.log('Incorrect configuration');
        process.exit(0);
    }

    if (!that.initialized) {
        that.initialized = true;
    }
};

Api.prototype.makeRequest = function (name, params, callback) {
    var that = this, http = require('http');

    try {
        var requestData = new Buffer(queryString.stringify(params));
        var options = {
            host: that.options.domain,
            path: name,
            method: 'POST',
            headers: {
                'Content-Encoding': 'utf-8',
                'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                'Content-Length': requestData.length
            }
        };

        var request = http.request(options, function (response) {
            var responseData = '';
            response.on('data', function (chunk) {
                responseData += chunk;
            });

            response.on('end', function () {
                if (typeof callback === 'function') {
                    try {
                        callback(JSON.parse(responseData));
                    } catch (e) {
                        console.log(e);
                    }
                }
            });
        });

        request.write(requestData);
        request.end();
    } catch (e) {
        console.log(e);
    }
};

Api.prototype.makeUploadRequest = function (name, params, callback) {
    var that = this;

    try {
        var form = new formData();
        for (var paramName in params) {
            form.append(paramName, params[paramName]);
        }

        form.submit({
            host: that.options.domain,
            path: name,
            method: 'POST'
        }, function (error, response) {
            var responseData = '';
            response.on('data', function (chunk) {
                responseData += chunk;
            });

            response.on('end', function () {
                if (typeof callback === 'function') {
                    try {
                        callback(JSON.parse(responseData));
                    } catch (e) {
                        console.log(e);
                    }
                }
            });
        });
    } catch (e) {
        console.log(e);
    }
};

/**
 * @param options
 */
exports.connect = function (options) {
    return new Api(options);
};