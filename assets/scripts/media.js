var $ = require('jquery');
var Ractive = require('ractive');

var MediaBrowser = function (options) {
    this.options = $.extend({}, MediaBrowser.DEFAULTS, options);

    this.items = [];
    this.errors = [];

    this.init();

    return this;
};

MediaBrowser.DEFAULTS = {
    modalUrl: null,
    callback: null,
    insertOnUpload: false,
    afterInit: function () {}
};

MediaBrowser.prototype.init = function () {
    this.createElements();
    this.loadModal();
};

MediaBrowser.prototype.createElements = function () {
    // div containing the modal
    this.element = document.createElement('div');
    this.element.className = 'modal';
    this.element.id = 'tg-media-modal';
    // hidden input element for file uploads
    this.fileSelect = document.createElement('input');
    this.fileSelect.type = 'file';
    this.fileSelect.multiple = true;

    this.client = new XMLHttpRequest();
};

MediaBrowser.prototype.loadModal = function () {
    var that = this;

    $.ajax(that.options.modalUrl).then(function (template) {
        that.template = template;
        that.bindRactive();
    });
};

MediaBrowser.prototype.bindRactive = function () {
    var that = this;

    this.ractive = new Ractive({
        el: that.element,
        template: that.template,
        data: {
            drop: false,
            load: false,
            filter: 'all',
            order: 'newest',
            errors: that.errors,
            items: that.items,
            icon: function (attribute, value) {
                if (this.get(attribute) === value) {
                    return 'fa-check-square-o';
                }
                return 'fa-square-o';
            }
        }
    });

    this.bindActions();
    this.bindDrop();
    this.bindUpload();

    this.options.afterInit(this.element);

    this.loadItems();
};

MediaBrowser.prototype.bindActions = function () {
    var that = this;

    this.fileSelect.addEventListener('change', function () {
        that.createItems(this);
    }, true);

    this.ractive.on('select', function (event) {
        event.original.preventDefault();
        if (that.callback) {
            that.callback(event.node.href);
        }
    });

    this.ractive.on('filter', function (event, filter) {
        event.original.preventDefault();
        this.set('filter', filter);
        that.loadItems();
    });

    this.ractive.on('order', function (event, order) {
        event.original.preventDefault();
        this.set('order', order);
        that.loadItems();
    });

    this.ractive.on('show-delete', function (event, id) {
        event.original.preventDefault();
        event.original.stopPropagation();

        this.set(event.keypath + '.confirm', true);
    });

    this.ractive.on('hide-delete', function (event, id) {
        event.original.preventDefault();
        event.original.stopPropagation();

        this.set(event.keypath + '.confirm', false);
    });

    this.ractive.on('delete', function (event, id) {
        event.original.preventDefault();
        event.original.stopPropagation();

        that.deleteItem(id);
        this.set(event.keypath + '.confirm', false);
    });
};

MediaBrowser.prototype.bindDrop= function () {
    var that = this;

    this.ractive.on('prevent-drag', function (event) {
        if (event.original.preventDefault) {
            event.original.preventDefault();
        } else {
            event.original.returnValue = false;
        }
    });

    this.ractive.on('select-upload', function (event) {
        event.original.preventDefault();
        that.fileSelect.click();
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
            that.createItems(event.original.dataTransfer);
        }
    });
};

MediaBrowser.prototype.bindUpload = function () {
    var that = this;

    this.client.addEventListener('load', function (event) {
        if (event.target.response) {
            var result = JSON.parse(event.target.response);
            if (result.success) {
                that.onSuccess(result.success);
            } else if (result.success) {

            }
        }
        that.ractive.set('load', false);
    }, true);

    this.client.addEventListener('error', function transferFailed(evt) {
        that.ractive.set('load', false);
    }, false);

    this.client.addEventListener('abort', function transferFailed(evt) {
        that.ractive.set('load', false);
    }, false);
};

MediaBrowser.prototype.addErrors = function (errors) {
    for (var i = 0; i < errors.length; i += 1) {
        this.errors.push({
            type: 'danger',
            message: errors[i]
        });
    }
};

MediaBrowser.prototype.loadItems = function () {
    var that = this;
    var url = this.ractive.find('.modal-content').getAttribute('data-index');

    $.get(url, {
            filter: that.ractive.get('filter'),
            order: that.ractive.get('order')
        },
        function (data) {
            if (data.success) {
                that.items = data.success;
                that.ractive.set('items', that.items);

                $('.thumbnail', that.element).tooltip({
                    animation: false,
                    placement: 'top'
                });
            } else if (data.errors) {
                that.addErrors(data.errors);
            }
        }
    );
};

MediaBrowser.prototype.deleteItem = function (id) {
    var that = this;
    var url = this.ractive.find('.modal-content').getAttribute('data-delete');

    $.post('/api/delete', {file: id}, function (data) {
        if (data.success) {
            that.items = that.items.filter(function(obj) {
                return obj.id !== data.success;
            });
            that.ractive.merge('items', that.items);
        } else if (data.errors) {
            that.addErrors(data.errors);
        }
    });

};

MediaBrowser.prototype.createItems = function (data) {
    var that = this;
    var count = data.files.length;
    var url = this.ractive.find('.modal-content').getAttribute('data-create');

    this.ractive.set('load', true);

    var finished = function () {
        count -= 1;
        if (count === 0) {
            that.ractive.set('load', false);
            // that.ractive.set('filter', 'all');
            // that.ractive.set('order', 'newest');
        }
    };

    $.each(data.files, function (i, file) {
        var formData = new FormData();
        formData.append('file', file);

        that.createItem(url, formData, finished);
    });
};

MediaBrowser.prototype.createItem = function (url, formData, finished) {
    var that = this;

    $.ajax({
        url: url,
        type: 'POST',
        data: formData,
        cache: false,
        dataType: 'json',
        processData: false,
        contentType: false,
        success: function(data) {
            if (data.success) {
                that.items.unshift(data.success);
                that.ractive.merge('items', that.items);
                if (that.callback && that.options.insertOnUpload) {
                    that.callback(data.success.path);
                }
            } else if (data.errors) {
                that.addErrors(data.errors);
            }
            finished();
        },
        error: function(data) {
            if (data.errors) {
                that.addErrors(data.errors);
            }
            finished();
        }
    });
};

exports.MediaBrowser = MediaBrowser;
