var $ = require('jquery');
var Ractive = require('ractive');
var fs = require('fs');

var modal = null;

var create_modal = function (on_select) {

    var handle_upload = function () {

        var file = this.files[0];

        var formData = new FormData();
        formData.append('file', file);

        var client = new XMLHttpRequest();
        client.open('POST', '/api/post', true);
        //client.setRequestHeader('Content-Type', 'multipart/form-data');
        client.send(formData);

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

            on_select('fresh upload');
        }, false);

        client.addEventListener('error', function transferFailed(evt) {
            console.log('An error occurred while transferring the file.');
        }, false);

        client.addEventListener('abort', function transferFailed(evt) {
            console.log('The transfer has been canceled by the user.');
        }, false);
    };

    var elem = document.createElement('div');
    elem.className = 'modal';
    elem.id = 'tg-media-modal';

    var input = document.createElement('input');
    input.type = 'file';

    input.addEventListener('change', handle_upload, true);

    var ractive = new Ractive({
        el: elem,
        template: fs.readFileSync(__dirname + '/templates/browser.html', 'utf8'),
        data: {
            drop: false,
            images: []
        }
    });

    ractive.on('show-dropzone', function (event) {
        this.set('drop', true);
    });

    ractive.on('hide-dropzone', function (event) {
        this.set('drop', false);
    });

    ractive.on('drag-over', function (event) {
        event.original.preventDefault();
    });

    ractive.on('drop', function (event) {
        if (event.original.dataTransfer && event.original.dataTransfer.files.length) {
            event.original.preventDefault();
            event.original.stopPropagation();
            handle_upload.call(event.original.dataTransfer);
            this.set('drop', false);
        }
    });

    ractive.on('select', function (event) {
        event.original.preventDefault();
        on_select(event.node.href);
    });

    ractive.on('select-upload', function (event) {
        event.original.preventDefault();
        input.click();
    });


    $.getJSON('/api', function(data) {
        ractive.set('images', data.images);
    });

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
