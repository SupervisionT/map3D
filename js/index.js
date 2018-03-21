var tileSize,
    everyOther = true,
    drawElev = false,
    tilesData = {};
    
L.mapbox.accessToken = 'pk.eyJ1IjoicGFuZ2VhbWFwcyIsImEiOiJjaWdra3A1bjgwMHRwdW5senp6ajZzN2Z5In0.pZv62GV1KFSFmcnJqMCnFQ';

var map = L.map('map_canvas', {
    worldCopyJump: true,
    doubleClickZoom: false,
    center: [37.7576793, -122.5076407],
    zoom: 9,
    scrollWheelZoom: false
    });

var hash = L.hash(map);

L.mapbox.tileLayer('https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.pngraw?access_token='+ L.mapbox.accessToken).addTo(map);

var elevTiles = new L.TileLayer.Canvas({
    unloadInvisibleTiles:true,
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
});
console.log('elevTiles', elevTiles)

elevTiles.on('tileunload', function(e){
    // tilesData = [...tilesData, e.tile._tilePoint.id];  
    elevWorker.postMessage({'data':e.tile._tilePoint.id,'type':'tileunload'});
});

window.onload = function() {
    var tileSize = elevTiles.options.tileSize;
    var keys = Object.keys(elevTiles._tiles)

    var imageDataArray = keys.map(key => {
        var context = elevTiles._tiles[key].getContext('2d');
        var imageData = context.getImageData(0, 0, tileSize, tileSize);
        console.log('imageData', imageData.data, key);
        var dataArray = new Float32Array(65536);
        for (var i=0;i<imageData.data.length/4;i++) {
            var tDataVal = -10000 + ((imageData.data[i * 4] * 256 * 256 + imageData.data[i * 4 + 1] * 256 + imageData.data[i * 4 + 2]) * 0.1);
            // console.log('tDataVal ', tDataVal)
            // var alpha;

            // if (tDataVal > 10) {
            //     alpha = 0;
            // } else {
            //     alpha = 100;
            // }
            // imageData.data[i * 4] = 10;
            // imageData.data[i*4+1] = 20;
            // imageData.data[i*4+2] = 200;
            // imageData.data[i*4+3] = alpha;

            dataArray[i] = tDataVal;
        }

       delete imageData.data;
        return {key, dataArray}
        })
        // imageObj = new Image();
        // imageObj.crossOrigin = 'Anonymous';
        // imageObj.src = 'https://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/'+x+'.pngraw?access_token=' + L.mapbox.accessToken;
        // return imageObj;
        // })
        console.log('imageDataArray', imageDataArray);    
};


var elevWorker = new Worker('js/imagedata.js');

var tileContextsElev = {};

var locs = location.search.split('?');

if (locs.length > 1) {
    locs = locs[1].split('=');
} else {
    locs = ['no']
}

if (locs[0] == 'elev') {
    elev_filter = parseInt(locs[1]);
} else {
    elev_filter = 10;
}

elevWorker.postMessage({
    data: elev_filter,
    type:'setfilter'}
);

elevTiles.drawTile = function (canvas, tile, zoom) {
    tileSize = this.options.tileSize;

    var context = canvas.getContext('2d'),
        imageObj = new Image(),
        tileUID = ''+zoom+'/'+tile.x+'/'+tile.y;
        console.log('tileUID vs tile.id', tileUID, tile.id)
    var drawContext = canvas.getContext('2d');
    // console.log('context',context)
    // To access / delete elevTiles later
    tile.id = tileUID;

    tileContextsElev[tileUID] = drawContext;

    imageObj.onload = function() {
        // Draw Image Tile
        context.drawImage(imageObj, 0, 0);

        // Get Image Data
        var imageData = context.getImageData(0, 0, tileSize, tileSize);

        elevWorker.postMessage({
            data:{
                tileUID:tileUID,
                tileSize:tileSize,
                array:imageData.data,
                drawElev: drawElev
            },
                type:'tiledata'},
            [imageData.data.buffer]);
    };

    // Source of image tile
    imageObj.crossOrigin = 'Anonymous';
    imageObj.src = 'https://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/'+zoom+'/'+tile.x+'/'+tile.y+'.pngraw?access_token=' + L.mapbox.accessToken;

};

elevWorker.addEventListener('message', function(response) {
    if (response.data.type === 'tiledata') {
        var dispData = tileContextsElev[response.data.data.tileUID].createImageData(tileSize,tileSize);
        dispData.data.set(response.data.data.array);
        tileContextsElev[response.data.data.tileUID].putImageData(dispData,0,0);
    }
}, false);

elevTiles.addTo(map);


map.touchZoom.disable();
map.doubleClickZoom.disable();


function formatElev(elev) {
    return Math.round(elev)+' m';
}
function formatTemp(temp) {
    return Math.round(temp)+'° f';
}
