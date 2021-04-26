var starsGeometry;
// currently the only way i found to make fixed stars is to move them with the player
// this is keeping track of how much we moved
var starsGeometryLastPos;

// basically a set of PointMaterial with color 1, 1, 1,
// spread randomly with a minimum distance of 100'000 from the player
function addNight() {
	var numStars = 500;

	starsGeometry = new THREE.BufferGeometry();

	var positions = new Float32Array( numStars * 3 );
	var colors = new Float32Array( numStars * 3 );

	var n = 1000, n2 = n / 2;

	for ( var i = 0; i < positions.length; i += 3 ) {

		// positions
		var x=0, y=0, z=0;

		// todo: obviously there's a better way to do this
		while(x*x+y*y+z*z < 100000) {
			var x = Math.random() * n - n2;
			var y = Math.random() * n;
			var z = Math.random() * n - n2;
		}

		positions[ i ]     = x;
		positions[ i + 1 ] = y;
		positions[ i + 2 ] = z;

		colors[ i ]     = 1;
		colors[ i + 1 ] = 1;
		colors[ i + 2 ] = 1;

	}

	starsGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
	starsGeometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

	starsGeometry.computeBoundingSphere();

	var material = new THREE.PointsMaterial( { size: 1, vertexColors: THREE.VertexColors } );

	points = new THREE.Points( starsGeometry, material );
	scene.add( points );
	starsGeometryLastPos = {x:camera.position.x, y:camera.position.y, z:camera.position.z};
}


function updateNight() {
	// at day, don't show any stars
	// at night, max. number of stars at midnight
		
	var fromNoon = Math.abs(skyParameters.inclination)/0.5;	
	if(fromNoon < 1) {
		starsGeometry.setDrawRange( 0, 0 );
		return; // day, don't update stars pos
	}

	var night = fromNoon-1; // 0: beginning, 1: midnight
	var arr = starsGeometry.attributes.position.array;
	starsGeometry.setDrawRange( 0, night*arr.length );

	// move stars with player so player doesn't run "into" stars
	for( var i = 0; i<arr.length; i+=3)
	{
		arr[i+0] += camera.position.x-starsGeometryLastPos.x;
		arr[i+1] += camera.position.y-starsGeometryLastPos.y;
		arr[i+2] += camera.position.z-starsGeometryLastPos.z;
	}
	arr = starsGeometry.attributes.color.array;	
	

	// important, otherwise positions won't be updated
	starsGeometry.attributes.position.needsUpdate =true;
	// safe that we update the positions so far
	starsGeometryLastPos = {x:camera.position.x, y:camera.position.y, z:camera.position.z};
}
