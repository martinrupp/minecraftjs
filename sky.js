// see https://github.com/takahirox/takahirox.github.io/blob/master/three.js.mmdeditor/examples/webgl_shaders_sky.html

var skyParameters  = {
	turbidity: 10,
	rayleigh: 2,
	mieCoefficient: 0.005,
	mieDirectionalG: 0.8,
	luminance: 1,

	// noon i 0, day is -0.5 - 0.5
	// night is +/- 0.5-1
	// dawn is +/- 0.5
	inclination: 0,
	azimuth: 0.25, // Facing front,
	sun: true,
	distance: 400000
};
var sky, sunSphere, directionalLight, sunLight;

function updateParameters(parameters) {
	while(Math.abs(parameters.inclination) > 1) {
		if(parameters.inclination > 1) parameters.inclination-=2;
		else parameters.inclination+=2;
	}

	var uniforms = sky.uniforms;
	uniforms.turbidity.value = parameters.turbidity;
	uniforms.rayleigh.value = parameters.rayleigh;
	uniforms.luminance.value = parameters.luminance;
	uniforms.mieCoefficient.value = parameters.mieCoefficient;
	uniforms.mieDirectionalG.value = parameters.mieDirectionalG;

	var theta = Math.PI * ( parameters.inclination - 0.5 );
	var phi = 2 * Math.PI * ( parameters.azimuth - 0.5 );

	// position the sun
	sunSphere.position.x = skyParameters.distance * Math.cos( phi );
	sunSphere.position.y = skyParameters.distance * Math.sin( phi ) * Math.sin( theta );
	sunSphere.position.z = skyParameters.distance * Math.sin( phi ) * Math.cos( theta );
	sunSphere.visible = parameters.sun;

	sky.uniforms.sunPosition.value.copy( sunSphere.position );

		
	// noon i 0, day is 0..1, night is 1-2
	fromNoon = Math.abs(parameters.inclination)/0.5;

	if( fromNoon > 1) {
		// night: no directional light
		directionalLight.intensity = 0;
		sunLight.intensity = 0.3;
	}
	else {
		// day
		sunLight.intensity = 0.2*(1-fromNoon) + 0.3;
		var x=1;
		if(fromNoon > 0.9) // this is for the dawn so light doesn't go out abruptly
			x=(1-fromNoon)/0.1;
		directionalLight.intensity = 0.5*(1-fromNoon) + 0.2*x;
		var red = (1-fromNoon)*0.9+0.1;
		directionalLight.color.g = red;
		directionalLight.color.b = red;
	}
	directionalLight.position.set(sunSphere.position.x, sunSphere.position.y, sunSphere.position.z);
	directionalLight.target.position.set(0, 0, 0);
}

function addSky(scene)
{
	sky = new THREE.Sky();
	scene.add( sky.mesh );

	// Add Sun Helper
	sunSphere = new THREE.Mesh(
		new THREE.SphereBufferGeometry( 20000, 16, 8 ),
		new THREE.MeshBasicMaterial( { color: 0xffffff } )
	);
	sunSphere.position.y = - 700000;
	sunSphere.visible = true;
	scene.add( sunSphere );


	// ambient light from sun
	const color = 0xFFFFFF;
	const intensity = 0.7;
	sunLight = new THREE.AmbientLight(color, intensity);
	scene.add(sunLight);

	// directional light from sun
	const directionalColor = 0xFFFFFF;
	const directionalIntensity = 0.5;
	directionalLight = new THREE.DirectionalLight(directionalColor, directionalIntensity);
	directionalLight.position.set(0, 0, 0); // update later
	directionalLight.target.position.set(0, 0, 0);
	scene.add(directionalLight);
	scene.add(directionalLight.target);

/// GUI
	updateParameters(skyParameters);
}