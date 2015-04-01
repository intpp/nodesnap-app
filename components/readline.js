/**
 * Extending readline
 */
var readline = require('readline');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.hiddenQuestion = function (query, callback) {
    var stdin = process.openStdin();
    process.stdin.on("data", function (char) {
        char = char + "";
        switch (char) {
            case "\n":
            case "\r":
            case "\u0004":
                stdin.pause();
                break;
            default:
                process.stdout.write("\033[2K\033[200D" + query + Array(rl.line.length + 1).join("*"));
                break;
        }
    });

    rl.question(query, function (value) {
        rl.history = rl.history.slice(1);
        callback(value);
    });
};

module.exports = rl;

