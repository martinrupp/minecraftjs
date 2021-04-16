var autoJump = true;
function toggleAutoJump() {
	autoJump = !autoJump;
	document.getElementById("autoJumpButton").innerHTML = autoJump ? "AutoJump : On" : "AutoJump : Off" 
}

var stats = new Stats(); // three.js stats (FPS)
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

// setup scene and renderer
var scene = new THREE.Scene();
// background
scene.background = new THREE.Color(0x00ffff);
// fog
scene.fog = new THREE.Fog(0x555555, 10, 300);
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

var playerHeight = 15;
// a block
function Block(x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;
}

// var axesHelper = new THREE.AxesHelper( 5 );
// scene.add( axesHelper );

//construct blocks
var blocks = [];


camera.position.x = 0;
camera.position.y = 0;
camera.position.y = 50;

var minx, minz, maxx, maxz;

var inc = 0.05;
var amplitude = 50;
function getBlock(x, z) {
	var xoff = inc*x;
	var zoff = inc*z;
	var v = Math.round(noise.perlin2(xoff, zoff) * amplitude / 5) *5;
	return new Block(x * blockSize, v, z * blockSize);
}

var instancedChunk = undefined;
function generateInstancedChunk() {
	var blockBox = new THREE.BoxGeometry(5, 5, 5);
	instancedChunk = new THREE.InstancedMesh(blockBox, materialArray, blocks.length)
	for(var count=0; count < blocks.length; count++) {
		var b = blocks[count];
		let matrix = new THREE.Matrix4().makeTranslation( b.x, b.y, b.z );
		instancedChunk.setMatrixAt(count, matrix);
	}			
	scene.add(instancedChunk);
}

function generate() {
	updateBlocks(true);
}

var chunkSize = 100;
function blockOutOfSight(b) {
	return Math.abs(b.x-camera.position.x) > (chunkSize+2)*blockSize ||
		 Math.abs(b.z-camera.position.z) > (chunkSize+2)*blockSize
}

function updateBlocks(doNew) {
	var xoff = 0;
	var zoff = 0;
	var inc = 0.05;
	var amplitude = 50;
	var D = 20;
	xblockpos = (camera.position.x / 5) | 0
	zblockpos = (camera.position.z / 5) | 0	

	var minx2 = xblockpos - chunkSize;
	var maxx2 = xblockpos + chunkSize;
	var minz2 = zblockpos - chunkSize;
	var maxz2 = zblockpos + chunkSize;
	if( !doNew && Math.abs(minx2-minx) < 5 && Math.abs(minz-minz2) < 5) return;

	for(var x = minx2; x < maxx2; x++) {
		for(var z = minz2; z < maxz2; z++) {
			if( x >= minx && x < maxx && z >= minz && z < maxz) continue;
			var b = getBlock(x, z);
			blocks.push(b);
		}
	}

	blocks = blocks.filter( b => !blockOutOfSight(b));

	minx = minx2;
	minz = minz2;
	maxx = maxx2;
	maxz = maxz2;

	if(instancedChunk) scene.remove(instancedChunk);
	generateInstancedChunk();
}

generate();

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

	var hitblock = blocks.find( b => blockSameXZ(b) && camera.position.y < b.y+playerHeight );
	if( hitblock !== undefined) {
		camera.position.y = hitblock.y + playerHeight;
		ySpeed = 0;
		// we hit the ground
		canJump = true;
	}

	 updateBlocks(false);
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
	stats.begin();
	update();
	render();
	stats.end();
	requestAnimationFrame(GameLoop);
}

GameLoop();
