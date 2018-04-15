var get_query_as_array = require('../lib/query-array');

(function($) {

  // =========================
  // EXPERIMENTS
  // =========================

  var experiments = {
    'control': {
      'download' : function() {
        $('.js-download-image').addClass('green');
      },
    }
  };


  // =========================
  // INITIALIZE
  // =========================

  var query = get_query_as_array(),
    keys = Object.keys(query);

  keys.forEach(function(key) {
    var value = query[key];
    var items = value.split('|').filter(function (n) { return (typeof n != "undefined" && n != "") });

    items.forEach(function(item) {
      if (typeof experiments[key] != "undefined" && typeof experiments[key][item] == "function")
        experiments[key][item]();
    });
  });

})(jQuery);
