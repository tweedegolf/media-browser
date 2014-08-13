var $ = require('jquery');
var Ractive = require('ractive');
var fs = require('fs');

var modal = null;

var handle_upload = function () {

    var file = this.files[0];
    var client = new XMLHttpRequest();
    var data = new FormData();

    data.append('upload', file);
    client.open('post', '/api/upload', true);
    client.setRequestHeader('Content-Type', 'multipart/form-data');
    client.send(data);

    client.addEventListener('progress', function (oEvent) {
        if (oEvent.lengthComputable) {
            var percentComplete = oEvent.loaded / oEvent.total;
            console.log('Progress: ' + percentComplete);
        } else {
            console.log('Unknown progress', oEvent);
        }
    }, false);

    client.addEventListener('load', function (evt) {
        console.log('The transfer is complete.');
    }, false);

    client.addEventListener('error', function transferFailed(evt) {
        console.log('An error occurred while transferring the file.');
    }, false);

    client.addEventListener('abort', function transferFailed(evt) {
        console.log('The transfer has been canceled by the user.');
    }, false);
};

var create_modal = function (on_select) {

    var elem = document.createElement('div');
    elem.className = 'modal';
    elem.id = 'tg-media-modal';

    var input = document.createElement('input');
    input.type = 'file';

    input.addEventListener('change', handle_upload, true);

    var i, data = [];
    for (i = 0; i < 10; i += 1) {
        data.push({
            'image': 'http://lorempixel.com/600/480/animals/' + i % 10,
            'thumb': 'http://lorempixel.com/200/150/animals/' + i % 10,
            'name': 'kat-' + i + '.jpg'
        });
    }

    var ractive = new Ractive({
        el: elem,
        template: fs.readFileSync(__dirname + '/templates/browser.html', 'utf8'),
        data: {
            drop: false,
            images: data
        }
    });

    ractive.on('show-dropzone', function (event) {
        this.set('drop', true);
    });

    ractive.on('hide-dropzone', function (event) {
        this.set('drop', false);
    });

    ractive.on('filedrop', function (event) {
        console.log(event);
        if (event.original.dataTransfer && event.original.dataTransfer.files.length) {
            event.original.preventDefault();
            event.original.stopPropagation();
        }
    });

    ractive.on('select', function (event) {
        event.original.preventDefault();
        on_select(event.node.href);
    });

    ractive.on('upload', function (event) {
        event.original.preventDefault();
        input.click();

    });



    //elem.addEventListener('drop', FileSelectHandler, false);
    //filedrag.style.display = 'block';



    return elem;
};


exports.tinymce_callback = function (field_name) {

    if (modal === null) {

        modal = create_modal(function (url) {
            $('#' + field_name).val(url);
            $(modal).modal('hide');
        });

        $(modal).modal();

    } else {

        $(modal).modal('show');
    }
};
