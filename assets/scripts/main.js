var $ = require('jquery');
var MediaBrowser = require('./media').MediaBrowser;

// hold the media browser singleton
var browser = null;

/**
 * tinyMCE callback function creator
 * Return a closure for the tinyMCE media browser callback
 * @param  {[type]} url URL to the TweedeGolfMediaBundle modal page
 * @return {function}   callback for tinyMCE
 */
exports.tinymce_callback = function (url) {

    /**
     * tinyMCE callback function
     * Triggeres an ajax request that results in a media picker modal
     * @param  {string} field_name name of the field the URL to the file should be inserted
     */
    return function (field_name) {

        // initiate only one media browser
        if (browser === null) {
            browser = new MediaBrowser({
                modalUrl: url,
                afterInit: function (element) {
                    $(element).modal({show: false});
                }
            });
        }

        // calback function that is triggered
        // after a file is clicked in the modal
        browser.callback = function (fileURL) {
            var elem = $('#' + field_name);

            // check if there is an tinyMCE url field
            if (elem.length > 0) {

                // insert the resulting file URL
                elem.val(fileURL);
            }

            // hide the browser modal
            $(browser.element).modal('hide');
        };

        // show the browser modal
        $(browser.element).modal('show');
    };
};
