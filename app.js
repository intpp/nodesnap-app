/**
 * Some description of this piece of shit
 */
var config = require('./data/config.json');
var application = require('./components/monosnap.js').getInstance(config);

application.start();