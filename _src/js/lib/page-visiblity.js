module.exports = function() {
    // Adapted from David Walsh (https://davidwalsh.name/page-visibility) who Adpated from Sam Dutton

    (function($){
        var visibilityChange,
            status;

        if (typeof document.hidden !== "undefined") {
        	visibilityChange = "visibilitychange";
            status = "hidden";
        } else if (typeof document.mozHidden !== "undefined") {
        	visibilityChange = "mozvisibilitychange";
            status = "mozHidden";
        } else if (typeof document.msHidden !== "undefined") {
        	visibilityChange = "msvisibilitychange";
            status = "msHidden";
        } else if (typeof document.webkitHidden !== "undefined") {
        	visibilityChange = "webkitvisibilitychange";
            status = "webkitHidden";
        }

        document.addEventListener(visibilityChange, function(){ $(document).trigger('page-visibility-change', [document[status]]) }, false);

        return status;
    })(jQuery);

}
