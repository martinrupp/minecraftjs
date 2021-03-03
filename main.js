// setup scene and renderer
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// setup camera
var FOV = 75; // field of view (in degrees)
var near = 0.1; // near clipping plane
var far = 1000; // far clipping plane
var aspectRatio = window.innerWidth / window.innerHeight;
var camera = new THREE.PerspectiveCamera(FOV, aspectRatio, near, far);

// a block
function Block(x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;

	this.display = function() {
		// the solid block
		var blockBox = new THREE.BoxBufferGeometry(5, 5, 5); // width, height, depth
		var blockMesh = new THREE.MeshBasicMaterial({color: 0x003300});
		var block = new THREE.Mesh(blockBox, blockMesh);
		scene.add(block);
		block.position.x = this.x;
		block.position.y = this.y;
		block.position.z = this.z;

		// the wireframe around it
		var edges = new THREE.EdgesGeometry(blockBox);
		var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: 0xffffff}) );
		scene.add(line);
		line.position.x = this.x;
		line.position.y = this.y;
		line.position.z = this.z;

	}
}

// construct blocks

var blocks = [];
var xoff = 0;
var zoff = 0;
var inc = 0.05;
var amplitude = 50;
var D = 30;
for(var x = -D; x < D; x++) {
	xoff = 0;
	for(var z = -D; z < D; z++) {
		var v = Math.round(noise.perlin2(xoff, zoff) * amplitude / 5) *5;
		v = v - 20;

		blocks.push( new Block(x * 5, v, z * 5) );
		xoff = xoff + inc;
	}
	zoff = zoff + inc;
}

for( var i =0; i < blocks.length; i++) {
	blocks[i].display();
}

// camera control
var controls = new THREE.PointerLockControls(camera, document.body);
document.body.addEventListener("click", function() {
	controls.lock();
});

controls.addEventListener("lock", function() {
});
controls.addEventListener("unlock", function() {
});

function update() {

}

// Resize Window listener for resetting camera
window.addEventListener("resize", function() {
	renderer.setSize( window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
});


// game loop
function render() {
	renderer.render(scene, camera);
}

// the requestAnimationFrame update loop
function GameLoop() {
	requestAnimationFrame(GameLoop);
	update();
	render();
}

GameLoop();