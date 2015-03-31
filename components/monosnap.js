var apiConnector = require('./api.js'),
    chokidar = require('chokidar'),
    fs = require('fs'),
    currentDirectory = process.cwd(),
    copyPaster = require('copy-paste').global(),
    instance;

var readline = require('readline');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var Application = function () {
    var that = this;

    that.apiObject = null;
    that.shortenerApiObject = null;
    that.authorized = false;

    that.config = {};
    that.watcher = null;

    that.accessToken = null;
    that.userData = {};

    that.images = {};
    that.imageUrlPrefix = 'https://monosnap.com/file/';
    that.uploadTimeouts = [];

    that.init = function () {
        that.apiObject = apiConnector.connect({
            "domain": "api.monosnap.com",
            "port": 80
        });

        that.shortenerApiObject = apiConnector.connect({
            "domain": "take.ms",
            "port": 80
        });

        that.images = that.loadData('images.json') || {};
        that.userData = that.loadData('user.json') || {};

        if (that.userData.access_token !== undefined) {
            that.accessToken = that.userData.access_token;
            that.authorized = true;
        }
    };

    that.init();
};

Application.prototype.isValidJSON = function (data) {
    try {
        if (JSON.parse(data)) {
            return true;
        }
    } catch (error) {
        return false;
    }

    return false;
};

Application.prototype.loadData = function (fileName) {
    var that = this,
        data = fs.readFileSync(currentDirectory + '/data/' + fileName, 'utf8');

    if (data !== false && that.isValidJSON(data)) {
        data = JSON.parse(data);

        return data;
    }

    return false;
};

/**
 * TODO: REFACTOR THIS SHIT!
 *
 * @param callback
 */
Application.prototype.authorize = function (callback) {
    var that = this;

    rl.question("Email: ", function (email) {
        if (email !== '') {
            rl.question("Password: ", function (password) {
                if (password !== '') {
                    rl.close();

                    that.apiObject.makeRequest('/login', {
                        "query": JSON.stringify({
                            "mail": email,
                            "pass": password,
                            "device_info": that.config.device_info
                        })
                    }, function (response) {
                        if (response.result === true) {
                            that.authorized = true;

                            that.accessToken = response.access_token;
                            that.userData = response.user;

                            fs.writeFile(currentDirectory + '/data/user.json', JSON.stringify(response));
                        } else {
                            that.authorized = false;
                        }

                        callback(that.authorized);
                    });
                } else {
                    console.log('Password can\'t be empty!');
                    rl.close();
                    callback(false);
                }
            });
        } else {
            console.log('Email can\'t be empty!');
            rl.close();
            callback(false);
        }
    });
};

Application.prototype.isAuthorized = function () {
    return this.authorized && this.userData !== {};
};

Application.prototype.getAccessToken = function () {
    return this.accessToken || null;
};

Application.prototype.start = function (config) {
    var that = this;

    that.config = config || {};
    if (!that.isAuthorized()) {
        that.authorize(function (result) {
            if (result) {
                that.watch();
            }
        });
    } else {
        that.watch();
    }
};

Application.prototype.isNewFile = function (path) {
    var that = this,
        imageName = path.replace(that.config.directory, "");

    for (var id in that.images) {
        if (that.images[id] === imageName) {
            return false;
        }
    }
    return true;
};

Application.prototype.watch = function () {
    var that = this;

    that.watcher = chokidar.watch(that.config.directory, {
        ignored: /[\/\\]\./, persistent: true
    });

    that.watcher
        .on('ready', function () {
            this.on('add', function (path) {
                that.uploadFile(path);
            });
            this.on('change', function (path) {
                that.uploadFile(path);
            });
        });
};

Application.prototype.uploadFile = function (path) {
    var that = this,
        fileName = path.replace(that.config.directory, "");

    if (that.isNewFile(path)) {
        clearTimeout(that.uploadTimeouts[fileName]);

        that.uploadTimeouts[fileName] = setTimeout(function () {
            console.log('Start uploading ' + path);

            that.apiObject.makeUploadRequest('/image/create', {
                attachment: fs.createReadStream(path),
                query: JSON.stringify({
                    access_token: that.getAccessToken(),
                    time: Math.floor(Date.now() / 1000),
                    title: fileName
                })
            }, function (response) {
                if (response.result) {
                    that.addToUploaded(response.image.id, fileName);
                    delete that.uploadTimeouts[fileName];

                    that.shortenerApiObject.makeRequest('/create', {
                        "query": JSON.stringify({
                            "url": that.imageUrlPrefix + response.image.id
                        })
                    }, function (response) {
                        if (response.result) {
                            copyPaster.copy(response.short_url);
                        }
                    });
                }
            });
        }, 1000);
    }
};

Application.prototype.addToUploaded = function (id, name) {
    var that = this;

    console.log('Adding new file: ' + id + ' => ' + name);
    that.images[id] = name;

    fs.writeFile(currentDirectory + '/data/images.json', JSON.stringify(that.images));
};

exports.getInstance = function () {
    if (instance === undefined) {
        instance = new Application();
    }

    return instance;
};