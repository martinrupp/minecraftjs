var geometry, geometryLastPos;

function addNight() {
	var particles = 500;

	geometry = new THREE.BufferGeometry();

	var positions = new Float32Array( particles * 3 );
	var colors = new Float32Array( particles * 3 );

	var color = new THREE.Color();

	var n = 1000, n2 = n / 2; // particles spread in the cube

	for ( var i = 0; i < positions.length; i += 3 ) {

		// positions
		var x=0, y=0, z=0;

		while(x*x+y*y+z*z < 100000) {
			var x = Math.random() * n - n2;
			var y = Math.random() * n;
			var z = Math.random() * n - n2;
		}


		positions[ i ]     = x;
		positions[ i + 1 ] = y;
		positions[ i + 2 ] = z;

		// colors

		var vx = 1;
		var vy = 1;
		var vz = 1;

		color.setRGB( vx, vy, vz );

		colors[ i ]     = color.r;
		colors[ i + 1 ] = color.g;
		colors[ i + 2 ] = color.b;

	}

	geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
	geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

	geometry.computeBoundingSphere();

	//

	var material = new THREE.PointsMaterial( { size: 1, vertexColors: THREE.VertexColors } );

	points = new THREE.Points( geometry, material );
	scene.add( points );
	geometryLastPos = {x:camera.position.x, y:camera.position.y, z:camera.position.z};
}


function updateNight() {
	var arr = geometry.attributes.position.array;
	for( var i = 0; i<arr.length; i+=3)
	{
		arr[i+0] += camera.position.x-geometryLastPos.x;
		arr[i+1] += camera.position.y-geometryLastPos.y;
		arr[i+2] += camera.position.z-geometryLastPos.z;
	}
	arr = geometry.attributes.color.array;
	var fromNoon = Math.abs(skyParameters.inclination);
	
		// night is 0.5-1
		// noon i 0
		// undergang 0.5 // 0
		// nacht 1. // 0.5
	var night = (fromNoon-0.5)/0.5;
	if(fromNoon < 0.5)
		geometry.setDrawRange( 0, 0 );
	else
		geometry.setDrawRange( 0, night*arr.length );

	geometry.attributes.position.needsUpdate =true;
	geometryLastPos = {x:camera.position.x, y:camera.position.y, z:camera.position.z};
}
