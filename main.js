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

// shadow
    // renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap


// setup camera
var FOV = 75; // field of view (in degrees)
var near = 0.1; // near clipping plane
var far = 1000; // far clipping plane
far = 2000000;
var aspectRatio = window.innerWidth / window.innerHeight;
var camera = new THREE.PerspectiveCamera(FOV, aspectRatio, near, far);
var blockSize = 5;

var loader = new THREE.TextureLoader();

// gras
var grasSideTexture = new THREE.MeshStandardMaterial({map : loader.load("texture/side.jpg")});
var grasTopTexture = new THREE.MeshStandardMaterial({map : loader.load("texture/top.jpg")});
var grasBottomTexture = new THREE.MeshStandardMaterial({map : loader.load("texture/bottom.jpg")});

let grasMatArr = [
	grasSideTexture,
	grasSideTexture,
	grasTopTexture,
	grasBottomTexture,
	grasSideTexture,
	grasSideTexture
];

// cobbleStone
var cobblestoneTexture = new THREE.MeshStandardMaterial({map : loader.load("texture/cobblestone2.png"), roughness: 0.2});
//refractionRatio: 0.4, reflectivity: 0.6,transparent : true,opacity : 0.5});
let cobblestoneMatArr = Array(6).fill( cobblestoneTexture );


let woodMatArr = Array(6).fill( new THREE.MeshStandardMaterial({map : loader.load("texture/wood.png")}) );
let goldMatArr = Array(6).fill( new THREE.MeshStandardMaterial({map : loader.load("texture/gold.png"), roughness: 0.2, reflectivity: 0.9,
	emissive: new THREE.Color( 'yellow' ) }) );
let glasMatArr = Array(6).fill( new THREE.MeshStandardMaterial({map : loader.load("texture/gold.png"), roughness: 0.2, 
	refractionRatio: 0.4, reflectivity: 0.6,transparent : true,opacity : 0.5 } ) );


//createShadow(scene);
addSky(scene);
addNight(scene);


var playerHeight = 15;
// a block
function Block(x, y, z, type) {
	this.x = x;
	this.y = y;
	this.z = z;
	this.type = type;
}

// var axesHelper = new THREE.AxesHelper( 5 );
// scene.add( axesHelper );

//construct blocks
var blocks = [];

const ID_GRAS = 0;
const ID_COBBLESTONE = 1;
const ID_LIGHT = 2;
const ID_WOOD = 3;
const ID_GLAS = 4;

const blockTypes = [ID_GRAS, ID_COBBLESTONE, ID_LIGHT, ID_WOOD, ID_GLAS];
const materialArrays = [ grasMatArr, cobblestoneMatArr, goldMatArr, woodMatArr, glasMatArr ];

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
	return new Block(x * blockSize, v, z * blockSize, ID_GRAS);
}

function addInstancedChunk(material, blocksArr) {
	if(blocksArr === undefined || blocksArr.length == 0) return;
	var blockBox = new THREE.BoxGeometry(5, 5, 5);
	var chunk = new THREE.InstancedMesh(blockBox, material, blocksArr.length)
	for(var count=0; count < blocksArr.length; count++) {
		var b = blocksArr[count];
		let matrix = new THREE.Matrix4().makeTranslation( b.x, b.y, b.z );
		chunk.setMatrixAt(count, matrix);
	}
	//addShadow(chunk);
	instancedChunks.push(chunk);
	scene.add(chunk);
}


var instancedChunks = undefined;
function generateInstancedChunk() {
	if(instancedChunks !== undefined && instancedChunks.length != 0) {
		instancedChunks.forEach( c => scene.remove(c) );
	}
	instancedChunks = [];
	for( var i = 0; i < blockTypes.length; i++ ) {
		addInstancedChunk(materialArrays[i], blocks.filter(b => b.type == blockTypes[i]));
	}
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

function destroyBlock() {
	var r = getRaycastBlockAdjacent(instancedChunks);
	if(r === undefined) return;
	f = blocks.filter( b => { return b.x == r.x && b.y == r.y && b.z == r.z; } );
	if(f !== undefined && f.length != 0 && f[0].light)
		scene.remove(f[0].light);
	blocks = blocks.filter( 
		b => { return b.x != r.x || b.y != r.y || b.z != r.z; } );
	generateInstancedChunk();
}

function addPointLight(scene, x, y, z) {
    var light2 = new THREE.PointLight(0xff4040, 1.0, 200, 0.5);
    light2.position.set(x, y, z);
    scene.add(light2);
    return light2;
}

function placeBlock(type) {
	var r = getRaycastBlock(instancedChunks);
	if(r === undefined) return;
	var b = new Block(r.x, r.y, r.z, type.id);
	if(type.light)
		b.light = addPointLight(scene, r.x, r.y, r.z);
	else
		b.light = undefined;
	
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
	else if(e.key == "1") {
		placeBlock({id:ID_COBBLESTONE, light:false});
	}
	else if(e.key == "2") {
		placeBlock({id:ID_GRAS, light:false});
	}
	else if(e.key == "3") {
		placeBlock({id:ID_LIGHT, light:true});
	}
	else if(e.key == "4") {
		placeBlock({id:ID_WOOD, light:false});
	}
	else if(e.key == "5") {
		placeBlock({id:ID_GLAS, light:false});
	}
	else if(e.key == "e") {
		destroyBlock();
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
// var gravity = 0.0;

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

// game render/drawing function
function render() {
	raycasting(instancedChunks);
	skyParameters.inclination += 0.001;
	updateParameters(skyParameters);
	updateNight();
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
