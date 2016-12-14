// Set up the scene, camera, and renderer as global variables.
var scene, camera, renderer, frog, onLog = false, truck, cameraP;
var cars = [],
    logs = [],
    carCount = 0,
    logCount = 0,
    carWidth = 1.5,
    logWidth = 2,
    carSpeed = [],
    logSpeed = [];

var frogWidth = 0.7;
var frog_position_y = -6;
var cCollide = frogWidth / 2 + carWidth / 2 - .1;
var lCollide = (frogWidth / 4 + logWidth / 4) + .5;
var background_audio, source, car_hit_audio, drown_audio, jump_audio, over_audio, win_audio;
var score_div, lives_div, resetDiv;
var lives;
var keyinput;
var play_background;
var perspectiveCamera = false;

var WIDTH = window.innerWidth/16,
    HEIGHT = window.innerHeight/16;

init();
function init() {

    var div = document.querySelector("#game");
    score_div = document.querySelector("#score");
    lives_div = document.querySelector("#lives");
    resetDiv = document.querySelector("#reset");

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({alpha: true, antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMapEnabled = true;
    renderer.shadowMapType = THREE.PCFSoftShadowMap;

    div.appendChild(renderer.domElement);

    camera = new THREE.OrthographicCamera(-WIDTH, WIDTH, HEIGHT, -HEIGHT, -30, 30);
    camera.position.set(0, -2.8, -2.9); // Change -1 to -.02
    camera.zoom = 9; // for birds eye view
    camera.updateProjectionMatrix();

    cameraP = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 0.1, 20000);
    cameraP.position.set(0, frog_position_y-1, -1.2);
    scene.add(cameraP);

    window.addEventListener('resize', function() {
        var WIDTH = window.innerWidth,
            HEIGHT = window.innerHeight;
        renderer.setSize(WIDTH, HEIGHT);
        if(!perspectiveCamera) {
            camera.aspect = WIDTH / HEIGHT;
            camera.updateProjectionMatrix();
        }
        else{
            cameraP.aspect = WIDTH/HEIGHT;
        }
    });

    var ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);
    var light = new THREE.PointLight(0xffffff);
    light.position.set(0, -5, -5);
    light.castShadow = true;
    light.shadowDarkness = 0.1;
    light.shadowCameraVisible = true;
    scene.add(light);

    //SOUNDS
    background_audio = document.createElement('audio');
    var source1 = document.createElement('source');
    source1.src = "sounds/background_audio.mp3"
    background_audio.appendChild(source1);

    jump_audio = document.createElement('audio');
    var source2 = document.createElement('source');
    source2.src = "sounds/jump.m4a"
    jump_audio.appendChild(source2);

    car_hit_audio = document.createElement('audio');
    var source3 = document.createElement('source');
    source3.src = "sounds/car_hit.wav"
    car_hit_audio.appendChild(source3);

    drown_audio = document.createElement('audio');
    var source4 = document.createElement('source');
    source4.src = "sounds/drown.wav"
    drown_audio.appendChild(source4);

    over_audio = document.createElement('audio');
    var source5 = document.createElement('source');
    source5.src = "sounds/game_over.mov"
    over_audio.appendChild(source5);

    win_audio = document.createElement('audio');
    var source6 = document.createElement('source');
    source6.src = "sounds/win.mov"
    win_audio.appendChild(source6);

    //Initialize all variables
    restart();

    //Truck
    truck = createTruck();
    scene.add(truck);

    //Frog
    var loader = new THREE.JSONLoader();
    loader.load( "models/frog.json", function(geometry){
        var material = new THREE.MeshLambertMaterial({color: 0x49d849});
        frog = new THREE.Mesh(geometry, material);
        frog.scale.x=frog.scale.y=frog.scale.z=0.002;
        frog.position.set(0, frog_position_y, -0.9);
        frog.rotation.x = -90 * Math.PI / 180;
        frog.castShadow = true;
        frog.receiveShadow = false;

        scene.add(frog);
        animate();
    });
    //Footpath
    renderBackgroundObject("footpath", 18, 1, -6, 8, 1);
    renderBackgroundObject("grass", 18, 1, 4, 8, 1);

    //GRASS
    renderBackgroundObject("grass", 18, 1, -1, 6, 1);

    //Road
    renderBackgroundObject("road", 18, 4, -3.5, 8, 2);

    //Water
    renderBackgroundObject("water1", 18, 4, 1.5, 8, 2);

    //Finish
    renderBackgroundObject("footpath", 18, 1, 5, 6, 1);

    //Cars
    carGeo = new THREE.BoxGeometry(carWidth, 0.3, .3);
    carMat = new THREE.MeshBasicMaterial({
        vertexColors: THREE.VertexColors,
        side: THREE.FrontSide
    });
    carGeo.faces[2].color = new THREE.Color(0x0077FF);
    carGeo.faces[3].color = new THREE.Color(0x1177FF);
    carGeo.faces[4].color = new THREE.Color(0x3388FF);
    carGeo.faces[5].color = new THREE.Color(0x3388FF);
    carGeo.faces[6].color = new THREE.Color(0x3388FF);
    carGeo.faces[7].color = new THREE.Color(0x3388FF);
    carGeo.faces[8].color = new THREE.Color(0x3388FF);
    carGeo.faces[9].color = new THREE.Color(0x3388FF);
    carGeo.faces[10].color = new THREE.Color(0x5599FF);
    carGeo.faces[11].color = new THREE.Color(0x5599FF);

    //LOGS
    logGeo = new THREE.BoxGeometry(logWidth, 0.6, 0.05);
    var objectTexture = new THREE.ImageUtils.loadTexture("textures/wood.jpg");
    objectTexture.wrapS = THREE.RepeatWrapping;
    objectTexture.wrapT = THREE.RepeatWrapping;
    objectMaterial = new THREE.MeshLambertMaterial({map: objectTexture, side: THREE.DoubleSide});

    cars[0] = new THREE.Mesh(carGeo, carMat);
    logs[0] = new THREE.Mesh(logGeo, objectMaterial);

    cars[0].position.set(11, -3, 0);
    logs[0].position.set(11, 3, 0);

    for (i = 0; i < 40; i++) {
        cars[i] = cars[0].clone();
        cars[i].castShadow = true;
        cars[i].receiveShadow = true;

        scene.add(cars[i]);
    }
    cars[2] = truck;

    for (i = 0; i < 40; i++) {
        logs[i] = logs[0].clone();
        logs[i].castShadow = true;
        logs[i].receiveShadow = true;
        scene.add(logs[i]);
    }
    for (i = 0; i < 40; i++) {
        carSpeed[i] = 0;
        logSpeed[i] = 0;
    }
    carGen(-2);
    carGen(-4);
    carGen(-3);
    carGen(-5);
    logGen(2);
    logGen(0);
    logGen(3);
    logGen(1);

    // Add OrbitControls so that we can pan around with the mouse.

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controlsP = new THREE.OrbitControls(cameraP, renderer.domElement);
    controls.enabled = false;
    controlsP.enabled = false;
}

// Renders the scene and updates the render as needed.
function animate() {
    requestAnimationFrame(animate);

    drive();
    carCollision();
    logCollision();
    waterCollision();
    win();
    // Render the scene.
    if(!perspectiveCamera) {
        renderer.render(scene, camera);
        controls.update();
    }
    else {
        renderer.render(scene, cameraP);
        controlsP.update();
    }
    if(play_background) {
        background_audio.play();
    }
    else{
        background_audio.pause();
    }
}

function renderBackgroundObject(name, width, height, y_value, repeat_x, repeat_y) {
    var objectGeometry = new THREE.BoxGeometry(width,height, 1);
    var objectTexture = new THREE.ImageUtils.loadTexture("textures/"+ name+".jpg");
    objectTexture.wrapS = THREE.RepeatWrapping;
    objectTexture.wrapT = THREE.RepeatWrapping;
    objectTexture.repeat.set(repeat_x,repeat_y);
    var objectMaterial = new THREE.MeshLambertMaterial({map: objectTexture, side: THREE.DoubleSide});
    var object = new THREE.Mesh(objectGeometry, objectMaterial);
    object.position.y = y_value;
    object.receiveShadow = true;
    scene.add(object);
}

document.addEventListener("keyup", keyUp);
LEFT = 37;
UP = 38;
RIGHT = 39;
DOWN = 40;

function jump(){
    jump_audio.play();
    frog.position.z +=0.2;
}
function keyUp(e) {
    if (keyinput) {
        e.preventDefault();
        onLog = false;

        switch (e.keyCode) {
            case UP:
                if (frog.position.y <= 6) {
                    frog.position.y += 1;
                    frog.position.z -=0.2;
                    window.setTimeout(jump, 80);
                    if(perspectiveCamera){
                        cameraP.position.y +=1;
                    }
                }
                break;
            case DOWN:
                if (frog.position.y > -6) {
                    frog.position.y -= 1
                    frog.position.z -=0.2;
                    window.setTimeout(jump, 80);
                    if(perspectiveCamera){
                        cameraP.position.y -=1;
                    }
                }
                break;

            case LEFT:
                if (frog.position.x < 8) {
                    frog.position.x += 1
                    frog.position.z -=0.2;
                    window.setTimeout(jump, 80);
                }
                break;

            case RIGHT:
                if (frog.position.x > -8) {
                    frog.position.x -= 1
                    frog.position.z -=0.2;
                    window.setTimeout(jump, 80);
                }
                break;
        }
    }
    else {
        if (e.keyCode == 13) {
           restart();
        }
    }
    score = frog.position.y + 6;
    score_div.innerHTML = score;
}

function carGen(y_pos) {
    speed = (Math.floor(Math.random() * (5 - 1)) + 1) / 80;
    numCars = Math.floor(Math.random() * (Math.abs(y_pos)*2 - 2)) + 2;
    xDir = 1;

    if (Math.floor(y_pos)%2 == 0) {
        xDir = -1;
    }

    xPos = -6 * xDir;

    for (x = 0; x < numCars; x++) {
        if (carCount < 20) {
            carCount++;
        } else {
            carCount = 0;
        }

        cars[carCount].position.set(xPos, y_pos, -0.7);
        carSpeed[carCount] = speed * xDir;

        xPos -= 5 * xDir ;
    }
}

function logGen(y_pos) {
    speed = (Math.floor(Math.random() * (3 - 1)) + 1) / 70;
    numLogs = Math.floor(Math.random() * (4 - 3)) + 3;
    xDir = 1;

    if (y_pos%2 == 0) {
        xDir = -1;
    }
    if (logSpeed[logCount] == speed * xDir) {
        speed /= 1.5;
    }

    xPos = -6 * xDir;

    for (x = 0; x < numLogs; x++) {
        if (logCount < 39) {
            logCount++;
        } else {
            logCount = 0;
        }

        logs[logCount].position.set(xPos, y_pos, -0.51);
        logSpeed[logCount] = speed * xDir;

        xPos -= 5 * xDir;
    }
}

// Animate cars/logs
function drive() {
    for (d = 0; d < cars.length; d++) {
        cars[d].position.x += carSpeed[d];
        logs[d].position.x += logSpeed[d];

        if (cars[d].position.x > 10 && carSpeed[d] > 0) {
            cars[d].position.x = -10;
        } else if (cars[d].position.x < -10 && carSpeed[d] < 0) {
            cars[d].position.x = 10;
        }
        if (logs[d].position.x > 14 && logSpeed[d] > 0) {
            logs[d].position.x = -14;
        } else if (logs[d].position.x < -14 && logSpeed[d] < 0) {
            logs[d].position.x = 14;
        }
    }
}
//Detect Collision
function carCollision() {
    for (c = 0; c < cars.length; c++) {
        if (frog.position.y == cars[c].position.y) {
            if (frog.position.x < cars[c].position.x + cCollide &&
                frog.position.x > cars[c].position.x - cCollide) {
                car_hit_audio.play();
                gameOver();
            }
        }
    }
}

function waterCollision() {
    if (onLog == false) {
        if (frog.position.y > -1 &&  frog.position.y < 4) {
            drown_audio.play();
            gameOver();
        }
    }
}

function logCollision() {
    for (l = 0; l < logs.length; l++) {
        if (Math.ceil(frog.position.y) == logs[l].position.y) {
            if (frog.position.x < logs[l].position.x + lCollide &&
                frog.position.x > logs[l].position.x - lCollide) {
                onLog = true;

                if (frog.position.x > logs[l].position.x) {
                    frog.position.x = logs[l].position.x + .5;
                } else {
                    frog.position.x = logs[l].position.x - .5;
                }
                if (frog.position.x > 10 || frog.position.x < -10) {
                    gameOver();
                }
            }
        }
    }
}

function createTruck() {
    var mtlLoader5 = new THREE.MTLLoader();
    var container = new THREE.Object3D();
    mtlLoader5.setPath('models/Truck/')
    mtlLoader5.load('RV_closed.mtl', function(materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();

        objLoader.setPath('models/Truck/')
        objLoader.setMaterials(materials);
        objLoader.load('RV closed.obj', function(object) {
            object.scale.x = object.scale.y = object.scale.z = 0.0020;
            truck = object;
            truck.rotation.y = 90 * Math.PI / 180;
            truck.rotation.z = 90 * Math.PI / 180;
            truck.rotation.x = 180 * Math.PI / 180;
            truck.position.z = 0.2;
            container.add( truck );
        });});
    return container;
}

function gameOver() {
    frog.position.set(0, frog_position_y, -0.9)
    lives -=1;
    score_div.innerHTML = "0";
    cameraP.position.set(0, frog.position.y-3, -1);
    camera.position.set(0, -2.8, -2.9);
    camera.updateProjectionMatrix();
    switch (lives) {
        case 3:
            lives_div.innerHTML = '<img src="textures/lives.png" width="25px" height="20px">' +
                '<img src="textures/lives.png" width="25px" height="20px">' +
                '<img src="textures/lives.png" width="25px" height="20px">';
            break;
        case 2:
            lives_div.innerHTML = '<img src="textures/lives.png" width="25px" height="20px">' +
                '<img src="textures/lives.png" width="25px" height="20px">';
            break;

        case 1:
            lives_div.innerHTML = '<img src="textures/lives.png" width="25px" height="20px">';
            break;
        case 0:
            lives_div.innerHTML = '';
            break;
    }
    if(lives<=0){
        keyinput=false;
        lives = 3;
        play_background = false;
        over_audio.play();
        resetDiv.innerHTML = 'Game Over!!';

        resetDiv.style.visibility = "visible";
    }
}

function win(){
    if(frog.position.y == 5){
        frog.position.y = frog_position_y;
        play_background = false;
        win_audio.play();
        keyinput = false;
        score_div.innerHTML = "10";
        resetDiv.innerHTML = "You Win!!"
        resetDiv.style.visibility = "visible";
    }
}

function restart() {
    keyinput = true;
    perspectiveCamera = false;
    lives = 3;
    lives_div.innerHTML = '<img src="textures/lives.png" width="25px" height="20px">' +
        '<img src="textures/lives.png" width="25px" height="20px">' +
        '<img src="textures/lives.png" width="25px" height="20px">';
    resetDiv.style.visibility = "hidden";
    play_background = true;
    over_audio.pause();
    cameraP.position.set(0, frog_position_y-1, -1.2);
    camera.position.set(0, -2.8, -2.9);
    camera.updateProjectionMatrix();
}

function changeCamera() {
    if(perspectiveCamera){
        perspectiveCamera = false;
    }
    else if(!perspectiveCamera){
        perspectiveCamera = true;
        cameraP.position.set(0, frog.position.y-1, -1.2);
    }
}