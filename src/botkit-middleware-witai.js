var Logger = require('node-wit').Logger;
var levels = require('node-wit').logLevels;
var Wit = require('node-wit').Wit;

var logger = new Logger(levels.DEBUG);

// not used at the moment
var actions = {
    say(sessionId, context, message, cb) {
        console.log(message);
        cb();
    },
    merge(sessionId, context, entities, message, cb) {
        cb(context);
    },
    error(sessionId, context, error) {
        console.log(error.message);
    }
};

module.exports = function(config) {

    if (!config || !config.token) {
        throw new Error('No wit.ai API token specified');
    }

    if (!config.minimum_confidence) {
        config.minimum_confidence = 0.5;
    }

    var client = new Wit(config.token, actions, logger);

    var middleware = {};

    middleware.receive = function(bot, message, next) {
        if (message.text) {
            client.message(message.text, (error, data) => {
                if (error) {
                    next(error);
                } else {
                    // not sure how to handle multiple outcomes right now
                    message.entities = data.outcomes[0].entities;
                    next();
                }
            });
        }
    };

    middleware.hears = function(tests, message) {
        if (message.entities.intent) {
            for (var i = 0; i < message.entities.intent.length; i++) {
                for (var t = 0; t < tests.length; t++) {
                    if (message.entities.intent[i].value == tests[t]) {
                        return true;
                    }
                }
            }
        }

        return false;
    };

    return middleware;
};
