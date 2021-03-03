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
		block.position.y = this.y-20;
		block.position.z = this.z;

		// the wireframe around it
		var edges = new THREE.EdgesGeometry(blockBox);
		var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: 0xffffff}) );
		scene.add(line);
		line.position.x = this.x;
		line.position.y = this.y-20;
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
		//v = v - 20;

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

// keyboard control
var keys = []
document.addEventListener("keydown", function(e) {
	keys.push(e.key);
	if(e.key == " ") {
		ySpeed = -7;		
	}
});

document.addEventListener("keyup", function(e) {
	var newArr = [];
	for( var i = 0; i < keys.length; i++) {
		if(keys[i] != e.key)
			newArr.push(keys[i]);
	}
	keys = newArr;
});


// game state update function
var movingSpeed = 1.5;
var ySpeed = 0;
var gravity = 1;
function update() {
	if(keys.includes("w")) {
		controls.moveForward(movingSpeed);
	}
	if(keys.includes("a")) {
		controls.moveRight(-movingSpeed);
	}
	if(keys.includes("s")) {
		controls.moveForward(-movingSpeed);
	}
	if(keys.includes("d")) {
		controls.moveRight(movingSpeed);
	}

	camera.position.y = camera.position.y - ySpeed;
	ySpeed += gravity;

	for( var i =0; i < blocks.length; i++ ) {
		var b = blocks[i];
		if(camera.position.x <= b.x+5 && camera.position.x >= b.x &&
			camera.position.z <= b.z+5 && camera.position.z >= b.z) {
			console.log(b);
			if(camera.position.y < b.y) 
			{
				camera.position.y = b.y;
				ySpeed = 0;
				break;
			}
		}
	}
}

// Resize Window listener for resetting camera
window.addEventListener("resize", function() {
	renderer.setSize( window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
});


// game render/drawing function
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