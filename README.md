tweedegolf-media-browser
========================

Frond-end scripts for the [tweedegolf media bundle](https://github.com/tweedegolf/media-bundle). See the tweedegolf media bundle](https://github.com/tweedegolf/media-bundle) for a complete installation guide and documentation.

## Installation and configuration
Add the media bundle to `bower.json`:

```json
"dependencies": {
    "tweedegolf-media-browser": "0.1.0"
},
```

## Usage

The media browser provides a `scss` file with styling and a `javascript` file that exposes a callback for tinyMCE. Example usage:

```javascript
var $ = require('jquery');
window.jQuery = window.$ = $; // required for bootstrap

require('bootstrap-sass-twbs/assets/javascripts/bootstrap');
require('tinymce/jquery.tinymce.min');
var media_callback = require('tweedegolf-media-browser').tinymce_callback('/api/modal');

$(function () {

    var tinymce_config = {
        theme: 'modern',
        plugins: 'link image',
        file_browser_callback: media_callback
    };

    $('.tinymce').tinymce(tinymce_config);

);

```
