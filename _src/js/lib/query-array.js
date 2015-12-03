module.exports = function() {
    // http://www.developerdrive.com/2013/08/turning-the-querystring-into-a-json-object-using-javascript/
    var pairs = location.search.slice(1).split('&');
    var result = {};
    pairs.forEach(function(pair) {
        pair = pair.split('=');
        result[pair[0]] = decodeURIComponent(pair[1] || '');
    });

    return JSON.parse(JSON.stringify(result));
};
