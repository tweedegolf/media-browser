var fs = require('fs');

exports.render = function (name) {
    var filename = name + '.html';
    return fs.readFileSync(__dirname + '/templates/' + filename, 'utf8');
};


