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
//scene.background = new THREE.Color(0x00ffff);
// fog
//scene.fog = new THREE.Fog(0x555555, 10, 300);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// https://threejsfundamentals.org/threejs/lessons/threejs-lights.html
addSky(scene);

var geometry, geometryLastPos;

// setup camera
var FOV = 75; // field of view (in degrees)
var near = 0.1; // near clipping plane
var far = 1000; // far clipping plane
far = 2000000;
var aspectRatio = window.innerWidth / window.innerHeight;
var camera = new THREE.PerspectiveCamera(FOV, aspectRatio, near, far);
var blockSize = 5;


var loader = new THREE.TextureLoader();

var sideTexture = new THREE.MeshStandardMaterial({map : loader.load("texture/side.jpg")});
var topTexture = new THREE.MeshStandardMaterial({map : loader.load("texture/top.jpg")});
var bottomTexture = new THREE.MeshStandardMaterial({map : loader.load("texture/bottom.jpg")});

let materialArray = [
	sideTexture,
	sideTexture,
	topTexture,
	bottomTexture,
	sideTexture,
	sideTexture
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
	if(instancedChunk) scene.remove(instancedChunk);
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
//var chunkSize = 3;
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

	generateInstancedChunk();
}

generate();

// camera control
var controls = new THREE.PointerLockControls(camera, document.body);
document.body.addEventListener("click", function() {
	controls.lock();
	if(controls.isLocked) {
		destroyBlock();
	}
});

// not working correctly yet
document.body.addEventListener('contextmenu', e => {
  placeBlock();
  e.preventDefault();
});


controls.addEventListener("lock", function() {

});

controls.addEventListener("unlock", function() {
});


// keyboard control
var keys = []
var canJump = true;
var placedBlocks = [];

function jump() {
	if(canJump) {
		ySpeed = -1.3;
		canJump = false;
	}
}

function getRaycastIntersection() {
	const raycaster = new THREE.Raycaster();
	const pointer = new THREE.Vector2();
	// this could be the mouse pos, but for MC, the ray is always in the middle of the screen
	pointer.x = (0.5) * 2 - 1;
	pointer.y = -1 *0.5 * 2 + 1;

	raycaster.setFromCamera(pointer, camera);
	return raycaster.intersectObject(instancedChunk);
}

function getRaycastBlockInc(inc) {
	var intersection = getRaycastIntersection();
	if( intersection[0] === undefined || intersection[0].distance >= 40) 
		return undefined;
	plane.visible = true;
	var materialIndex = intersection[0].face.materialIndex;
	var position = intersection[0].point;
	var x = Math.round(position.x/blockSize)*blockSize;
	var y = Math.round(position.y/blockSize)*blockSize;
	var z = Math.round(position.z/blockSize)*blockSize;
	switch(materialIndex) {
		case 0: // right
			x = position.x + inc;
			break;
		case 1: // left
			x = position.x - inc;
			break;
		case 2: // top
			y = position.y + inc;
			break;
		case 3: // bottom
			y = position.y - inc;
			break;
		case 4: // front
			z = position.z + inc;					
			break;
		case 5: // back
			z = position.z - inc;
			break;
	}
	x = x | 0;
	y = y | 0;
	z = z | 0;
	return {x:x, y:y, z:z}
}

function getRaycastBlockAdjacent() {
	return getRaycastBlockInc(-blockSize/2);
}

function getRaycastBlock() {
	return getRaycastBlockInc(+blockSize/2);
}

function destroyBlock() {
	var r = getRaycastBlockAdjacent();
	if(r === undefined) return;
	blocks = blocks.filter( 
		b => { return b.x != r.x || b.y != r.y || b.z != r.z; } );
	generateInstancedChunk();


}

function placeBlock() {
	var r = getRaycastBlock();
	if(r === undefined) return;
	var b = new Block(r.x, r.y, r.z);
	placedBlocks.push(b);
	blocks.push(b);
	console.log("placing " + b.x + ", " + b.y + ", " + b.z)
	generateInstancedChunk();
}

document.addEventListener("keydown", function(e) {
	keys.push(e.key);
	if(e.key == controlOptions.jump) {
		jump();
	}
	else if(e.key == controlOptions.placeBlock) {
		placeBlock();
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
function blockSameXYZ(b) {
	return camera.position.x <= b.x + blockSize/2 && camera.position.x >= b.x - blockSize/2 &&
		camera.position.y - playerHeight <= b.y +blockSize/2 && camera.position.y - playerHeight >= b.y - blockSize/2
		&& camera.position.z <= b.z +blockSize/2 && camera.position.z >= b.z - blockSize/2;
}

function collidedWithBlock() {
	return blocks.find( b => { return blockSameXZ(b) && camera.position.y == b.y - blockSize; } ) !== undefined;
}

// game state update function
var movingSpeed = .7;
var ySpeed = 0;
var gravity = 0.08;

var controlOptions = {
	forward: "w",
	backward: "s",
	right: "d",
	left: "a",
	jump: " ", // space
	placeBlock: "q"
}
function update() {
	if(keys.includes(controlOptions.forward)) {		
		controls.moveForward(movingSpeed);
		if( !autoJump && collidedWithBlock() )
		 	controls.moveForward(-movingSpeed);
			
	}
	if(keys.includes(controlOptions.left)) {
		controls.moveRight(-movingSpeed);
		if( !autoJump && collidedWithBlock() )
		 	controls.moveRight(movingSpeed);
	}
	if(keys.includes(controlOptions.backward)) {
		controls.moveForward(-movingSpeed);
		if( !autoJump && collidedWithBlock() )
		 	controls.moveForward(movingSpeed);
	}
	if(keys.includes(controlOptions.right)) {
		controls.moveRight(movingSpeed);
		if( !autoJump && collidedWithBlock() )
		 	controls.moveRight(-movingSpeed);
	}

	var hitblock = blocks.find( b => blockSameXYZ(b) );
	if( ySpeed >= 0 && hitblock !== undefined) {
		camera.position.y = hitblock.y + blockSize/2 + playerHeight;
		ySpeed = 0;
		// we hit the ground
		canJump = true;
	}
	else
	{
		camera.position.y = camera.position.y - ySpeed;
		ySpeed += gravity;
	}

	updateBlocks(false);
}

// Resize Window listener for resetting camera
window.addEventListener("resize", function() {
	renderer.setSize( window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
});

var plane;

function raycasting() {
	var intersection = getRaycastIntersection();
	if( intersection[0] != undefined && intersection[0].distance < 40) {
		//console.log(intersection[0]);
		if( !scene.children.includes(plane) )
		{
			var planeG = new THREE.PlaneGeometry(5, 5);
			var planeM = new THREE.MeshBasicMaterial({color : 0xffffff, side: THREE.DoubleSide});
			planeM.transparent = true;
			planeM.opacity = 0.5;
			plane = new THREE.Mesh(planeG, planeM);
			scene.add(plane);
		} 
		else {
			plane.visible = true;
			var materialIndex = intersection[0].face.materialIndex;
			var position = intersection[0].point;
			const inc = 0.1;
			plane.rotation.x = 0;
			plane.rotation.y = 0;
			plane.rotation.z = 0;
			plane.position.x = Math.round(position.x/5)*5;
			plane.position.y = Math.round(position.y/5)*5;
			plane.position.z = Math.round(position.z/5)*5;
			switch(materialIndex) {
				case 0: // right
					plane.rotation.y = Math.PI/2;
					plane.position.x = position.x + inc;
					break;
				case 1: // left
					plane.rotation.y = Math.PI/2;
					plane.position.x = position.x - inc;
					break;
				case 2: // top
					plane.rotation.x = Math.PI/2;
					plane.position.y = position.y + inc;
					break;
				case 3: // bottom
					plane.rotation.x = Math.PI/2;
					plane.position.y = position.y - inc;
					break;
				case 4: // front
					plane.position.z = position.z + inc;					
					break;
				case 5: // back
					plane.position.z = position.z - inc;
					break;
			}
		}
	}
	else {
		if(plane) {
			plane.visible = false;
		}
	}
}

// game render/drawing function
function render() {
	raycasting();
	skyParameters.inclination += 0.001;
	updateParameters(skyParameters);
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
