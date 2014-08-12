var $ = require('jquery');
var Ractive = require('ractive');
var fs = require('fs');

$(function () {

    var i, data = [];
    for (i = 0; i < 10; i += 1) {
        data.push({
            'image': 'http://lorempixel.com/600/480/animals/' + i,
            'thumb': 'http://lorempixel.com/200/150/animals/' + i,
            'name': 'kat-' + i + '.jpg'
        });
    }

    console.log(data);

    var ractive = new Ractive({
        // The `el` option can be a node, an ID, or a CSS selector.
        el: 'modal',

        // We could pass in a string, but for the sake of convenience
        // we're passing the ID of the <script> tag above.
        template: fs.readFileSync(__dirname + '/templates/browser.html', 'utf8'),

        // Here, we're passing in some initial data
        data: {
            showForm: false,
            images: data
        }
    });

    ractive.on('showForm', function (event) {
        this.set('showForm', true);
    });

});


