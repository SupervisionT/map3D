main = (data) => {

    if ( ! Detector.webgl ) {
        
                        Detector.addGetWebGLMessage();
                        document.getElementById( 'container' ).innerHTML = "";
        
                    }
        
                    var container, stats;
        
                    var camera, controls, scene, renderer;
        
                    var mesh, texture;
        
                    var worldWidth = 1536, worldDepth = 1024,
                    worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;
        
                    var clock = new THREE.Clock();
        
                    var helper;
        
                    var raycaster = new THREE.Raycaster();
                    var mouse = new THREE.Vector2();
        
                    init();
                    animate();
        
                    function init() {
        
                        container = document.getElementById( 'container' );
        
                        camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1/99, 100000000000000 );
        
                        scene = new THREE.Scene();
                        scene.background = new THREE.Color( 000000 );
        
                        controls = new THREE.OrbitControls(camera);
                        controls.target.set( 0.0, 100.0, 0.0 );
                        controls.userPanSpeed = 100;
        
                        // var data = generateHeight( worldWidth, worldDepth );
                        controls.target.y = data[ worldHalfWidth + worldHalfDepth * worldWidth ] + 2500;
                        camera.position.y =  controls.target.y + 2000;
                        camera.position.x = 2000;
        
                        var geometry = new THREE.PlaneBufferGeometry( 7500, 7500, worldWidth - 1, worldDepth - 1 );
                        geometry.rotateX( - Math.PI / 2 );
        
                        var vertices = geometry.attributes.position.array;
        
                        for ( var i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
        
                            vertices[ j + 1 ] = data[ i ] * 0.3; 
        
                        }
        
                        geometry.computeFaceNormals();
        
                        texture = new THREE.CanvasTexture( generateTexture( data, worldWidth, worldDepth ) );
                        // console.log('data', data, generateTexture( data, worldWidth, worldDepth ))
                        texture.wrapS = THREE.ClampToEdgeWrapping;
                        texture.wrapT = THREE.ClampToEdgeWrapping;
        
                        mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { map: texture } ) );
                        scene.add( mesh );
        
                        // var geometry = new THREE.CylinderGeometry( 0, 20, 100, 3 );
                        // geometry.translate( 50, 0, 0 );
                        // geometry.rotateX( Math.PI / 2 );
                        // helper = new THREE.Mesh( geometry, new THREE.MeshNormalMaterial() );
                        // scene.add( helper );
        
                        renderer = new THREE.WebGLRenderer();
                        renderer.setPixelRatio( window.devicePixelRatio );
                        renderer.setSize( window.innerWidth, window.innerHeight );
        
                        container.innerHTML = "";
        
                        container.appendChild( renderer.domElement );
                        // container.addEventListener( 'mousemove', onMouseMove, false );
        
                        // stats = new Stats();
                        // container.appendChild( stats.dom );
        
                        //
        
                        window.addEventListener( 'resize', onWindowResize, false );
        
                    }
        
                    function onWindowResize() {
        
                        camera.aspect = window.innerWidth / window.innerHeight;
                        camera.updateProjectionMatrix();
        
                        renderer.setSize( window.innerWidth, window.innerHeight );
        
                    }
               
                    function generateTexture( data, width, height ) {
        
                        var canvas, canvasScaled, context, image, imageData,
                        level, diff, vector3, sun, shade;
        
                        vector3 = new THREE.Vector3( 0, 0, 0 );
        
                        sun = new THREE.Vector3( 1, 1, 1 );
                        sun.normalize();
        
                        canvas = document.createElement( 'canvas' );
                        canvas.width = width;
                        canvas.height = height;
        
                        context = canvas.getContext( '2d' );
                        context.fillStyle = '#000';
                        context.fillRect( 0, 0, width, height );
        
                        image = context.getImageData( 0, 0, canvas.width, canvas.height );
                        imageData = image.data;
        
                        for ( var i = 0, j = 0, l = imageData.length; i < l; i += 4, j ++ ) {
        
                            vector3.x = data[ j - 2 ] - data[ j + 2 ];
                            vector3.y = 2;
                            vector3.z = data[ j - width * 2 ] - data[ j + width * 2 ];
                            vector3.normalize();
        
                            shade = vector3.dot( sun );

                            imageData[ i ] = ( 96 + shade * 128 ) * ( 0.5 + data[ j ] * 0.007 );
                            imageData[ i + 1 ] = ( 32 + shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );
                            imageData[ i + 2 ] = ( shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );
                        }
        
                        context.putImageData( image, 0, 0 );
        
                        // Scaled 4x
        
                        // canvasScaled = document.createElement( 'canvas' );
                        // canvasScaled.width = width;
                        // canvasScaled.height = height;
        
                        // context = canvasScaled.getContext( '2d' );
                        // // context.scale( 4, 4 );
                        // context.drawImage( canvas, 0, 0 );
        
                        // image = context.getImageData( 0, 0, canvasScaled.width, canvasScaled.height );
                        // imageData = image.data;
        
                        // for ( var i = 0, l = imageData.length; i < l; i += 4 ) {
        
                        //     var v = ~~ ( Math.random() * 5 );
        
                        //     imageData[ i ] += v;
                        //     imageData[ i + 1 ] += v;
                        //     imageData[ i + 2 ] += v;
        
                        // }
        
                        // context.putImageData( image, 0, 0 );
        
                        return canvas;
        
                    }
        
                    //
        
                    function animate() {
        
                        requestAnimationFrame( animate );
        
                        render();
                        // stats.update();
        
                    }
        
                    function render() {
        
                        controls.update();
                        renderer.render( scene, camera );
        
                    }
        
                    function onMouseMove( event ) {
        
                        mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
                        mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
                        raycaster.setFromCamera( mouse, camera );
        
                        // See if the ray from the camera into the world hits one of our meshes
                        var intersects = raycaster.intersectObject( mesh );
        
                        // Toggle rotation bool for meshes that we clicked
                        if ( intersects.length > 0 ) {
        
                            helper.position.set( 0, 0, 0 );
                            helper.lookAt( intersects[ 0 ].face.normal );
        
                            helper.position.copy( intersects[ 0 ].point );
        
                        }
        
                    }
        
}