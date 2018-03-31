var tileSize,
    everyOther = true,
    drawElev = false,
    srcs = ['9/85/196', '9/80/196', '9/81/196', '9/82/196', '9/83/196', '9/84/196',
        '9/85/197', '9/80/197', '9/81/197', '9/82/197', '9/83/197', '9/84/197',
        '9/85/194', '9/80/194', '9/81/194', '9/82/194', '9/83/194', '9/84/194',
        '9/85/195', '9/80/195', '9/81/195', '9/82/195', '9/83/195', '9/84/195'
    ],
    tilesData = [];

var mapboxAccessToken = 'pk.eyJ1IjoicGFuZ2VhbWFwcyIsImEiOiJjaWdra3A1bjgwMHRwdW5senp6ajZzN2Z5In0.pZv62GV1KFSFmcnJqMCnFQ';

var canvas = document.createElement('canvas'),
    context = canvas.getContext('2d');

var urls = srcs.map(src => (assembleUrl(null, src)));
var imgsData = urls.map(src => (defaultImage(src, function cb(res) {
    // console.log('res', res);
    // main(res.elev)
    tilesData = [...tilesData, res]
    tilesData = tilesData.sort(function (a, b) {
        return a.Y - b.Y || a.X - b.X;
    });
    if (tilesData.length == 24)
        combine(tilesData);
})));

function combine(x){
    var oneImage = new Float32Array();    
    for (var j = 0; j<24; j += 6){
        for (var i = 1; i<257; i ++){
            var chunk1 = x[j].elev.slice((i-1)*256, i*256);
            var chunk2 = x[j+1].elev.slice((i-1)*256, i*256);
            var chunk3 = x[j+2].elev.slice((i-1)*256, i*256);
            var chunk4 = x[j+3].elev.slice((i-1)*256, i*256);
            var chunk5 = x[j+4].elev.slice((i-1)*256, i*256);
            var chunk6 = x[j+5].elev.slice((i-1)*256, i*256);
            oneImage = oneImage.concat(chunk1).concat(chunk2).concat(chunk3).concat(chunk4).concat(chunk5).concat(chunk6);
        } 
    }
    main(oneImage);
}

function defaultImage(url, cb) {
    var img = new Image()
    img.crossOrigin = "Anonymous"
    var time = Date.now()
    img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;

        context.drawImage(img, 0, 0)
        var pixels = context.getImageData(0, 0, img.width, img.height);
        var dataArray = new Float32Array(65536);
        for (var i = 0; i < pixels.data.length / 4; i++) {
            var tDataVal = -10000 + ((pixels.data[i * 4] * 256 * 256 + pixels.data[i * 4 + 1] * 256 + pixels.data[i * 4 + 2]) * 0.1);
            dataArray[i] = tDataVal;
        }
        var locIndex = url.ID.split('/').map(x => (parseInt(x)));
        cb({
            X: locIndex[1],
            Y: locIndex[2],
            elev: dataArray
        });
    }
    img.onerror = function (err) {
        cb(err)
    }
    img.src = url.URL
}



function assembleUrl(img, coords) {

    var tileset = img ? 'mapbox.streets-satellite' : 'mapbox.terrain-rgb';
    var res = img ? '@2x.png' : '.pngraw';

    //domain sharding
    var serverIndex = 2 * (coords[1] % 2) + coords[2] % 2
    var server = ['a', 'b', 'c', 'd'][serverIndex]
    //return 'sample.png'
    // return 'https://'+server+'.tiles.mapbox.com/v4/'+tileset+'/'+slashify(coords)+res+'?access_token=pk.eyJ1IjoicGV0ZXJxbGl1IiwiYSI6ImpvZmV0UEEifQ._D4bRmVcGfJvo1wjuOpA1g'           
    return {
        ID: coords,
        URL: 'https://b.tiles.mapbox.com/v4/' + tileset + '/' + coords + res + '?access_token=' + mapboxAccessToken
    }
}
// "http://b.tiles.mapbox.com/v4/mapbox.outdoors/9/84/199@2x.pngraw?access_token=pk.eyJ1IjoicGFuZ2VhbWFwcyIsImEiOiJjaWdra3A1bjgwMHRwdW5senp6ajZzN2Z5In0.pZv62GV1KFSFmcnJqMCnFQ"