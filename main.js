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
	this.mesh;
	this.line;

	var playerHeight = 15;

	this.display = function() {
		// the solid block
		var blockBox = new THREE.BoxBufferGeometry(blockSize, blockSize, blockSize); // width, height, depth
		//var blockMesh = new THREE.MeshBasicMaterial({color: 0x003300});
		this.mesh = new THREE.Mesh(blockBox, materialArray);
		scene.add(this.mesh);
		this.mesh.position.x = this.x;
		this.mesh.position.y = this.y - playerHeight;
		this.mesh.position.z = this.z;

		// the wireframe around it
		var edges = new THREE.EdgesGeometry(blockBox);
		this.line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: 0xffffff}) );
		scene.add(this.line);
		this.line.position.x = this.x;
		this.line.position.y = this.y - playerHeight;
		this.line.position.z = this.z;

	}
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

function generate() {
	xblockpos = camera.position.x / 5
	zblockpos = camera.position.z / 5
	var chunkSize = 10;

	minx = xblockpos - chunkSize;
	maxx = xblockpos + chunkSize;
	minz = zblockpos - chunkSize;	
	maxz = zblockpos + chunkSize;
	for(var x = minx; x < maxx; x++) {
		for(var z = minz; z < maxz; z++) {
			blocks.push( getBlock(x, z) );
		}
	}

	for( var i =0; i < blocks.length; i++) {
		blocks[i].display();
	}
}

var chunkSize = 10;
function blockOutOfSight(b) {
	return Math.abs(b.x-camera.position.x) > (chunkSize+2)*blockSize ||
		 Math.abs(b.z-camera.position.z) > (chunkSize+2)*blockSize
}

function removeBlockFromScene(b) {
	scene.remove(b.mesh);
	scene.remove(b.line);
}

function updateBlocks() {
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
	if( minx2 == minx && minz == minz2) return;

	for(var x = minx2; x < maxx2; x++) {
		for(var z = minz2; z < maxz2; z++) {
			if( x >= minx && x < maxx && z >= minz && z < maxz) continue;
			var b = getBlock(x, z);
			blocks.push(b);
			b.display();
		}
	}

	blocks.filter(blockOutOfSight).forEach( removeBlockFromScene );
	blocks = blocks.filter( b => !blockOutOfSight(b));

	minx = minx2;
	minz = minz2;
	maxx = maxx2;
	maxz = maxz2;
}

generate();
// for(var x = -D; x < D; x++) {
// 	xoff = 0;
// 	for(var z = -D; z < D; z++) {
// 		var v = Math.round(noise.perlin2(xoff, zoff) * amplitude / 5) *5;
// 		//v = v - 20;

// 		blocks.push( new Block(x * blockSize, v, z * blockSize) );
// 		xoff = xoff + inc;
// 	}
// 	zoff = zoff + inc;
// }


// camera.position.y = 50;

// var chunks = [];
// var xoff = 0;
// var zoff = 0;
// var inc = 0.05;
// var amplitude = 30 + (Math.random() * 70);
// var renderDistance = 3;
// var chunkSize = 10;


// for(var i =0; i < renderDistance; i++) {
// 	var chunk = [];
// 	for(var j =0; j < renderDistance; j++) {
// 		for(var x = xblockpos -chunkSize; x < xblockpos +chunkSize; x++) {
// 			for(var z = zblockpos -chunkSize; z < zblockpos +chunkSize; z++) {
// 				xoff = inc*x;
// 				zoff = inc*z;
// 				var v = Math.round(noise.perlin2(xoff, zoff) * amplitude / 5) *5;
// 				chunk.push(new Block(x * blockSize, v, z * blockSize) );
// 			}
// 		}
// 	}
// 	chunks.push(chunk);
// }




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

	 updateBlocks();
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