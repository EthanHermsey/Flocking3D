//main
let cnv;
let renderer;
let scene;
let camera;
let engine;
let delta = 0;

//point object
let points;
let objRadius = 1200;

//boid values
let nodeSize = 4;
let maxNodeSpeed = 4;

//texture engine
let textureDim = 128;
let nodecount = textureDim * textureDim;
let positions;
let velocities;
let accelerations;
console.log(nodecount + ' patricles in this ball');

let displayShader = [];
let arrToTexShader;
let accelerationShader;
let velocityShader;
let positionShader;

//camera
let cameraDistance = 3200;
let cameraHeight = 100;
let cameraAngle = 0;
let cameraAngleIncrement = 0.001;

//dom
let perceptionSlider;
let steeringStrengthSlider;
let alignStrengthSlider;
let separationStrengthSlider;
let cohesionStrengthSlider;

function preload(){
	loadStrings('./shaders/displayVertexShader.txt', function(str){displayShader[0] = str.join('\n')});
	loadStrings('./shaders/displayFragmentShader.txt', function(str){displayShader[1] = str.join('\n')});

	loadStrings('./shaders/engineVertexShader.txt', function(str){engineShader = str.join('\n')})

	loadStrings('./shaders/arrToTexFragmentShader.txt', function(str){arrToTexShader = str.join('\n')})
	loadStrings('./shaders/accelerationFragmentShader.txt', function(str){accelerationShader = str.join('\n')})
	loadStrings('./shaders/velocityFragmentShader.txt', function(str){velocityShader = str.join('\n')})
	loadStrings('./shaders/positionFragmentShader.txt', function(str){positionShader = str.join('\n')})
}

function setup() {

	noCanvas();

	//DOM stuff
	initSliders();

	///three.js stuff
	initScene();

	//init engine
	engine = new Engine(textureDim);

	//create random node positions/velicities
	initPositionsAndVelocities()
	
	//points
	initPointObject();
	
	document.querySelector('.loading').style.display = 'none';

}










function draw() {
	if (frameCount != 1) delta = 60 / frameRate();
	
	update();
	moveCamera();
	renderer.render(scene, camera);
}



function mouseDragged() {
	
	cameraHeight = constrain(cameraHeight + (winMouseY - pwinMouseY) * 1.2, -1000, 1000);
	cameraAngle += (winMouseX - pwinMouseX) * 0.001;
	return;
	
}

function mouseWheel(event) {
	cameraDistance = constrain(cameraDistance + (event.delta), 100, 5000);
}

function moveCamera() {

	if (mouseIsPressed == false) cameraAngle += cameraAngleIncrement * delta;
	
	const x = cameraDistance * cos(cameraAngle)
	const z = cameraDistance * sin(cameraAngle)
	
	camera.position.set(x, cameraHeight, z);
	camera.lookAt(new THREE.Vector3());
}

function windowResized(){
	renderer.setSize(windowWidth, windowHeight);
	camera.aspect = windowWidth / windowHeight;
	camera.updateProjectionMatrix();
}







function update(){

	let accelerationsBuffer = engine.newRenderTarget();
	engine.render(engine.CALCULATE_ACCELERATIONS, accelerationsBuffer, [positions.texture, velocities.texture]);
	accelerations.dispose();
	accelerations = accelerationsBuffer;

	let velocitiesBuffer = engine.newRenderTarget();
	engine.render(engine.CALCULATE_VELOCITIES, velocitiesBuffer, [velocities.texture, accelerations.texture]);
	velocities.dispose();
	velocities = velocitiesBuffer;
	
	let positionsBuffer = engine.newRenderTarget();
	engine.render(engine.CALCULATE_POSITIONS, positionsBuffer, [positions.texture, velocities.texture]);
	positions.dispose();
	positions = positionsBuffer;

	points.material.uniforms.posTex.value =  positions.texture;
	points.material.uniforms.velTex.value =  velocities.texture;
	points.material.uniforms.accTex.value =  accelerations.texture;
	points.material.uniforms.delta.value =  delta;
	points.material.uniforms.maxForce.value = steeringStrengthSlider.value();
}








function initScene(){
	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(45, windowWidth / (windowHeight - 10), 0.1, 10000);
	camera.rotation.order = "YXZ"

	renderer = new THREE.WebGLRenderer({
		antialias: true
	});
	renderer.setSize(windowWidth, windowHeight);
	document.body.appendChild(renderer.domElement);

	//light
	scene.add(new THREE.AmbientLight(0x606059, 1));

	//'background' sphere
	var sg = new THREE.SphereGeometry(objRadius, 50, 50);
	var sm = new THREE.MeshPhongMaterial({
		color: new THREE.Color("hsl(225,100%,50%)"), 
		emissive: new THREE.Color("hsl(185,100%,50%)"), 
		emissiveIntensity: 0.1, 
		transparent: true, 
		opacity: 0.035, 
		side: THREE.BackSide
	});
	var smesh = new THREE.Mesh(sg, sm);
	scene.add(smesh);
}

function initPositionsAndVelocities(){
	let startPositions = new Float32Array(nodecount * 3);
	let startVelocities = new Float32Array(nodecount * 3);
	let startAccelerations = new Float32Array(nodecount * 3).fill(0);

	for (var i = 0; i < nodecount; i++){
		let ind = i * 3
		let sp = new THREE.Vector3(
			random(-1, 1),
			random(-1, 1),
			random(-1, 1)
		).setLength( random(objRadius) );
		startPositions[ind] = sp.x;
		startPositions[ind + 1] = sp.y;
		startPositions[ind + 2] = sp.z;
					
		startVelocities[ind] = random(-1, 1) * maxNodeSpeed;
		startVelocities[ind + 1] = random(-1, 1) * maxNodeSpeed;
		startVelocities[ind + 2] = random(-1, 1) * maxNodeSpeed;
	}

	positions = engine.arrayToTexture(startPositions);
	velocities = engine.arrayToTexture(startVelocities);
	accelerations = engine.arrayToTexture(startAccelerations);
}


function initSliders(){

	perceptionSlider = new LabelledSlider(1, 250, 100, 1, 'Perception range: ', 'The range of perception per particle');
	perceptionSlider.position(10, 20);

	steeringStrengthSlider = new LabelledSlider(0, 2, 1, 0.01, 'Steering strength: ', 'The maximum force that is applied to steer the particle');
	steeringStrengthSlider.position(10, 70);

	alignStrengthSlider = new LabelledSlider(0, 2, 1, 0.01, 'Align strength: ', "The maximum force that is applied to align the direction of the particle with it's neighboring particles");
	alignStrengthSlider.position(10, 120);

	separationStrengthSlider = new LabelledSlider(0, 2, 1, 0.01, 'Separation strength: ', "The maximum force that is applied to steer away from neighboring particles");
	separationStrengthSlider.position(10, 170);

	cohesionStrengthSlider = new LabelledSlider(0, 2, 1, 0.01, 'Cohesion strength: ', "The maximum force that is applied to steer towards neigboring partricles");
	cohesionStrengthSlider.position(10, 220);
}


function initPointObject(){
	let pointsgeo = new THREE.BufferGeometry();
	
	let luv = [];
	let pixelSize = 1 / textureDim;
	for (let x = 0; x < textureDim; x++){
		for (let y = 0; y < textureDim; y++){
			luv.push( x * pixelSize, y  * pixelSize);
		}
	}

	pointsgeo.addAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(nodecount * 3), 3));
	pointsgeo.addAttribute('luv', new THREE.Float32BufferAttribute(new Float32Array(luv), 2));
	
	let pointsmat = new THREE.ShaderMaterial({
		uniforms: {
			size: {value: nodeSize},
			radius: {value: objRadius},
			maxSpeed: {value: maxNodeSpeed},
			delta: {value: delta},
			maxForce: {value: steeringStrengthSlider.value()},
			posTex: {value: positions.texture},
			velTex: {value: velocities.texture},
			accTex: {value: ''},
			sprite: {value: new THREE.TextureLoader().load('resources/disc.png')}
		},
		vertexShader: displayShader[0],
		fragmentShader: displayShader[1],
		transparent: true,
		blending: THREE.AdditiveBlending
	});

	points = new THREE.Points(pointsgeo, pointsmat);
	scene.add(points);
}




