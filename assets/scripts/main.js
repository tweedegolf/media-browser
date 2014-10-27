var $ = require('jquery');
var Ractive = require('ractive');
var fs = require('fs');

var MediaBrowser = function (options) {
    this.options = $.extend({}, MediaBrowser.DEFAULTS, options);

    this.init();
    this.loadItems();

    return this;
};

MediaBrowser.DEFAULTS = {
    callback: null,
    items: [],
    insertOnUpload: false
};

MediaBrowser.prototype.init = function () {
    var browser = this;

    this.element = document.createElement('div');
    this.element.className = 'modal';
    this.element.id = 'tg-media-modal';

    this.confirm = {};

    this.fileSelect = document.createElement('input');
    this.fileSelect.type = 'file';
    this.fileSelect.multiple = true;

    this.template = fs.readFileSync(__dirname + '/templates/browser.html', 'utf8');

    this.ractive = new Ractive({
        el: browser.element,
        template: browser.template,
        data: {
            drop: false,
            load: false,
            filter: 'all',
            order: 'newest',
            items: browser.options.items,
            confirm: browser.confirm,
            icon: function (attribute, value) {
                if (this.get(attribute) === value) {
                    return 'fa-check-square-o';
                }
                return 'fa-square-o';
            },
            confirmDialog: function (id) {
                if (browser.confirm[id]) {
                    return '';
                }
                return 'hide';
            }
        }
    });

    this.client = new XMLHttpRequest();

    this.bindActions();
    this.bindDrop();
    this.bindUpload();
};

MediaBrowser.prototype.bindActions = function () {
    var browser = this;

    this.fileSelect.addEventListener('change', function () {
        browser.createItem(this);
    }, true);

    this.ractive.on('select', function (event) {
        event.original.preventDefault();
        if (browser.callback) {
            browser.callback(event.node.href);
        }
    });

    this.ractive.on('filter', function (event, filter) {
        event.original.preventDefault();
        this.set('filter', filter);
        browser.loadItems();
    });

    this.ractive.on('order', function (event, order) {
        event.original.preventDefault();
        this.set('order', order);
        browser.loadItems();
    });

    this.ractive.on('show-delete', function (event, id) {
        event.original.preventDefault();
        event.original.stopPropagation();

        browser.confirm[id] = true;
        this.set('confirm', browser.confirm);
    });

    this.ractive.on('hide-delete', function (event, id) {
        event.original.preventDefault();
        event.original.stopPropagation();

        delete browser.confirm[id];
        this.set('confirm', browser.confirm);
    });

    this.ractive.on('delete', function (event, id) {
        event.original.preventDefault();
        event.original.stopPropagation();

        browser.deleteItem(id);
        this.set('confirm', browser.confirm);
    });
};

MediaBrowser.prototype.bindDrop= function () {
    var browser = this;

    this.ractive.on('prevent-drag', function (event) {
        if (event.original.preventDefault) {
            event.original.preventDefault();
        } else {
            event.original.returnValue = false;
        }
    });

    this.ractive.on('select-upload', function (event) {
        event.original.preventDefault();
        browser.fileSelect.click();
    });

    this.ractive.on('dropzone', function (event, state) {
        this.set('drop', state === 'show');
    });

    this.ractive.on('drag-over', function (event) {
        event.original.preventDefault();
    });

    this.ractive.on('drop', function (event) {
        if (event.original.dataTransfer && event.original.dataTransfer.files.length) {
            event.original.preventDefault();
            event.original.stopPropagation();
            this.set('drop', false);
            browser.createItem(event.original.dataTransfer);
        }
    });
};

MediaBrowser.prototype.bindUpload = function () {
    var browser = this;

    this.client.addEventListener('load', function (event) {
        if (event.target.response) {
            var result = JSON.parse(event.target.response);
            if (result.success) {
                browser.onSuccess(result.success);
            } else if (result.success) {

            }
        }
        browser.ractive.set('load', false);
    }, true);

    this.client.addEventListener('error', function transferFailed(evt) {
        browser.ractive.set('load', false);
    }, false);

    this.client.addEventListener('abort', function transferFailed(evt) {
        browser.ractive.set('load', false);
    }, false);
};

MediaBrowser.prototype.addError = function () {

};

MediaBrowser.prototype.loadItems = function () {
    var browser = this;

    $.get('/api', {
            filter: browser.ractive.get('filter'),
            order: browser.ractive.get('order')
        },
        function (data) {
            if (data.success) {
                browser.options.items = data.success;
                browser.ractive.set('items', browser.options.items);
            }
        }
    );
};

MediaBrowser.prototype.deleteItem = function (id) {
    var browser = this;

    $.post('/api/delete', {file: id}, function (data) {
        if (data.success) {
            browser.options.items = browser.options.items.filter(function(obj) {
                return obj.id !== data.success;
            });
            browser.ractive.merge('items', browser.options.items);
        }
    });

};

MediaBrowser.prototype.createItem = function (data) {
    var browser = this;
    var count = data.files.length;
    this.ractive.set('load', true);

    var finished = function () {
        count -= 1;
        if (count === 0) {
            browser.ractive.set('load', false);
        }
    };

    $.each(data.files, function (i, file) {
        var formData = new FormData();
        formData.append('file', file);

        $.ajax({
            url: '/api/create',
            type: 'POST',
            data: formData,
            cache: false,
            dataType: 'json',
            processData: false,
            contentType: false,
            success: function(data) {
                if (data.success) {
                    browser.options.items.unshift(data.success);
                    browser.ractive.merge('items', browser.options.items);
                    if (browser.callback && browser.options.insertOnUpload) {
                        browser.callback(data.success.path);
                    }
                }
                finished();
            },
            error: function(data) {
                finished();
            }
        });
    });
};

var browser = null;

exports.tinymce_callback = function (field_name) {

    if (browser === null) {
        browser = new MediaBrowser();
        $(browser.element).modal({show: false});
    }

    browser.callback = function (url) {
        var elem = $('#' + field_name);
        if (elem.length > 0) {
            elem.val(url);
        }
        $(browser.element).modal('hide');
    };

    // $(browser.element).off('show.bs.modal').on('show.bs.modal', function () {
    //    $('.modal-content').css('height', $(window).height() * 0.8);
    // }).modal('show');

    $(browser.element).modal('show');
};
