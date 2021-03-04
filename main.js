var autoJump = true;
function toggleAutoJump() {
	autoJump = !autoJump;
	document.getElementById("autoJumpButton").innerHTML = autoJump ? "AutoJump : On" : "AutoJump : Off" 
}

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
var blockSize = 5;


var loader = new THREE.TextureLoader();
let materialArray = [
	new THREE.MeshBasicMaterial({map : loader.load("texture/side4.jpg")}),
	new THREE.MeshBasicMaterial({map : loader.load("texture/side1.jpg")}),
	new THREE.MeshBasicMaterial({map : loader.load("texture/top.jpg")}),
	new THREE.MeshBasicMaterial({map : loader.load("texture/bottom.jpg")}),
	new THREE.MeshBasicMaterial({map : loader.load("texture/side2.jpg")}),
	new THREE.MeshBasicMaterial({map : loader.load("texture/side3.jpg")})
];

// a block
function Block(x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;

	var playerHeight = 15;

	this.display = function() {
		// the solid block
		var blockBox = new THREE.BoxBufferGeometry(blockSize, blockSize, blockSize); // width, height, depth
		//var blockMesh = new THREE.MeshBasicMaterial({color: 0x003300});
		var block = new THREE.Mesh(blockBox, materialArray);
		scene.add(block);
		block.position.x = this.x;
		block.position.y = this.y - playerHeight;
		block.position.z = this.z;

		// the wireframe around it
		var edges = new THREE.EdgesGeometry(blockBox);
		var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: 0xffffff}) );
		scene.add(line);
		line.position.x = this.x;
		line.position.y = this.y - playerHeight;
		line.position.z = this.z;

	}
}

// var axesHelper = new THREE.AxesHelper( 5 );
// scene.add( axesHelper );

// construct blocks
var blocks = [];
var xoff = 0;
var zoff = 0;
var inc = 0.05;
var amplitude = 50;
var D = 20;
for(var x = -D; x < D; x++) {
	xoff = 0;
	for(var z = -D; z < D; z++) {
		var v = Math.round(noise.perlin2(xoff, zoff) * amplitude / 5) *5;
		//v = v - 20;

		blocks.push( new Block(x * blockSize, v, z * blockSize) );
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
var canJump = true;
document.addEventListener("keydown", function(e) {
	keys.push(e.key);
	if(e.key == " " && canJump) {
		ySpeed = -1.3;		
		canJump = false;
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

function blockSameXZ(b) {
	return camera.position.x <= b.x + blockSize/2 && camera.position.x >= b.x - blockSize/2 &&
		camera.position.z <= b.z +blockSize/2 && camera.position.z >= b.z - blockSize/2;
}
function collidedWithBlock() {
	return blocks.find( b => { return blockSameXZ(b) && camera.position.y == b.y - blockSize; } ) !== undefined;
}

// game state update function
var movingSpeed = .7;
var ySpeed = 0;
var gravity = 0.08;
function update() {
	if(keys.includes("w")) {		
		controls.moveForward(movingSpeed);
		if( !autoJump && collidedWithBlock() )
		 	controls.moveForward(-movingSpeed);
			
	}
	if(keys.includes("a")) {
		controls.moveRight(-movingSpeed);
		if( !autoJump && collidedWithBlock() )
		 	controls.moveRight(movingSpeed);
	}
	if(keys.includes("s")) {
		controls.moveForward(-movingSpeed);
		if( !autoJump && collidedWithBlock() )
		 	controls.moveForward(movingSpeed);
	}
	if(keys.includes("d")) {
		controls.moveRight(movingSpeed);
		if( !autoJump && collidedWithBlock() )
		 	controls.moveRight(-movingSpeed);
	}

	camera.position.y = camera.position.y - ySpeed;
	ySpeed += gravity;

	var hitblock = blocks.find( b => blockSameXZ(b) && camera.position.y < b.y );
	if( hitblock !== undefined) {
		camera.position.y = hitblock.y;
		ySpeed = 0;
		// we hit the ground
		canJump = true;
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