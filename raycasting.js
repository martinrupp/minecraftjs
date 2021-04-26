
function getRaycastIntersection(instancedChunks) {
	const raycaster = new THREE.Raycaster();
	const pointer = new THREE.Vector2();
	// this could be the mouse pos, but for MC, the ray is always in the middle of the screen
	pointer.x = (0.5) * 2 - 1;
	pointer.y = -1 *0.5 * 2 + 1;

	raycaster.setFromCamera(pointer, camera);

	var minIntersect = undefined;
	for( var i = 0; i < instancedChunks.length; i++) {
		var intersect = raycaster.intersectObject(instancedChunks[i]);
		if( (minIntersect === undefined || minIntersect[0] == undefined)
			|| (intersect[0] !== undefined && minIntersect[0].distance > intersect[0].distance) ) {
				minIntersect = intersect;
		}
	}
	return minIntersect;
}

function getRaycastBlockInc(instancedChunks, inc) {
	var intersection = getRaycastIntersection(instancedChunks);
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

function getRaycastBlockAdjacent(instancedChunks) {
	return getRaycastBlockInc(-blockSize/2);
}

function getRaycastBlock(instancedChunks) {
	return getRaycastBlockInc(instancedChunks, +blockSize/2);
}


var plane;

function raycasting(instancedChunks) {
	var intersection = getRaycastIntersection(instancedChunks);
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
