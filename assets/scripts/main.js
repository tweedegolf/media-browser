var $ = require('jquery');
var MediaBrowser = require('./media').MediaBrowser;

var browser = null;

exports.tinymce_callback = function (url) {

    return function (field_name) {

        if (browser === null) {
            browser = new MediaBrowser({
                modalUrl: url,
                afterInit: function (element) {
                    $(element).modal({show: false});
                }
            });
        }

        browser.callback = function (url) {
            var elem = $('#' + field_name);
            if (elem.length > 0) {
                elem.val(url);
            }
            $(browser.element).modal('hide');
        };

        $(browser.element).modal('show');
    };
};
