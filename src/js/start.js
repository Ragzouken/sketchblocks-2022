/**
 * @param {HTMLElement} element 
 */
function scaleElementToParent(element) {
    const parent = element.parentElement;

    const [tw, th] = [parent.clientWidth, parent.clientHeight];
    const [sw, sh] = [tw / element.clientWidth, th / element.clientHeight];
    let scale = Math.min(sw, sh);
    scale = scale > 1 ? Math.floor(scale) : scale;
    
    element.style.setProperty("transform", `translate(-50%, -50%) scale(${scale})`);

    return scale;
}


const cube = {
    name: "cube",

    faces: [
        {
            name: "front",
            positions: [[0, 1, 1], [0, 0, 1], [1, 0, 1], [1, 1, 1]],
            texturing: [   [1, 0],    [1, 1],    [0, 1],    [0, 0]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "back",
            positions: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]],
            texturing: [   [0, 1],    [1, 1],    [1, 0],    [0, 0]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "left",
            positions: [[1, 1, 1], [1, 0, 1], [1, 0, 0], [1, 1, 0]],
            texturing: [   [1, 0],    [1, 1],    [0, 1],    [0, 0]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "right",
            positions: [[0, 1, 0], [0, 0, 0], [0, 0, 1], [0, 1, 1]],
            texturing: [   [1, 0],    [1, 1],    [0, 1],    [0, 0]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "top",
            positions: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]],
            texturing: [   [1, 0],    [1, 1],    [0, 1],    [0, 0]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "bottom",
            positions: [[0, 0, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1]],
            texturing: [   [1, 0],    [1, 1],    [0, 1],    [0, 0]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },
    ],
}

const ramp =
{
    name: "ramp",

    faces:
    [
        {
            name: "slope",
            positions: [[0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 0]],
            texturing: [   [1, 1],    [1, 0],    [0, 0],    [0, 1]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "back",
            positions: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]],
            texturing: [   [0, 1],    [1, 1],    [1, 0],    [0, 0]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "bottom",
            positions: [[0, 0, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1]],
            texturing: [   [1, 0],    [1, 1],    [0, 1],    [0, 0]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "left",
            positions: [[1, 1, 0], [1, 0, 1], [1, 0, 0]],
            texturing: [   [1, 1],    [0, 0],    [1, 0]],
            triangles: [[0, 1, 2]]
        },

        {
            name: "right",
            positions: [[0, 0, 1], [0, 1, 0], [0, 0, 0]],
            texturing: [   [1, 0],    [0, 1],    [0, 0]],
            triangles: [[0, 1, 2]]
        },
    ],
}

const slab =
{
    name: "slab",

    faces: [
        {
            name: "front",
            positions: [[0, .5, 1], [0, 0, 1], [1, 0, 1], [1, .5, 1]],
            texturing: [   [1, .5],    [1, 1],    [0, 1],    [0, .5]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "back",
            positions: [[1, 0, 0], [0, 0, 0], [0, .5, 0], [1, .5, 0]],
            texturing: [   [0, 1],    [1, 1],    [1, .5],    [0, .5]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "left",
            positions: [[1, .5, 1], [1, 0, 1], [1, 0, 0], [1, .5, 0]],
            texturing: [   [1, .5],    [1, 1],    [0, 1],    [0, .5]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "right",
            positions: [[0, .5, 0], [0, 0, 0], [0, 0, 1], [0, .5, 1]],
            texturing: [   [1, .5],    [1, 1],    [0, 1],    [0, .5]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "top",
            positions: [[0, .5, 1], [1, .5, 1], [1, .5, 0], [0, .5, 0]],
            texturing: [   [1, 0],    [1, 1],    [0, 1],    [0, 0]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "bottom",
            positions: [[0, 0, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1]],
            texturing: [   [1, 0],    [1, 1],    [0, 1],    [0, 0]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },
    ],
}

const leveldata = {
    blocks: [
        ["ramp", [ 0, -1,  1], 14],
        ["ramp", [-1, -1,  1], 11],
        ["ramp", [-1, -1,  0], 5],

        ["cube", [-1,  0,  0]],
        ["cube", [ 0,  0,  0]],
        ["cube", [ 1,  0,  0]],
        ["slab", [ 1,  0, -1], 12],
        ["slab", [ 0,  0,  1], 8],
        ["slab", [ 1,  0,  1], 8],

        ["cube", [-1,  1,  0]],
        ["ramp", [ 0,  1,  0], 10],
        ["ramp", [-1,  1, -1], 13],

        ["cube", [-1,  2, -1]],
        ["ramp", [ 0,  2, -1], 14],

        ["slab", [ 0,  3, -1], 8],
    ],

    sprites: [
        { tile: "pillar", position: [ 0, 3.5, -1], vertical: true, text: "so refined.."},
        { tile: "orb", position: [1,  1,  -1], text: "I AM ORB." },
    ],
}

function makeGeometry(data) {
    const positions = [];
    const texcoords = [];
    const normals = [];
    const indexes = [];

    let nextIndex = 0;

    data.faces.forEach((face, faceIndex) =>
    {
        // offset indices relative to existing vertices
        const faceIndexes = face.triangles
            .reduce((a, b) => [...a, ...b], [])
            .map(index => nextIndex + index);

        indexes.push(...faceIndexes);
        nextIndex += face.positions.length;

        // compute shared normal and add all positions/texcoords/normals
        const p0 = new THREE.Vector3(...face.positions[0]);
        const p1 = new THREE.Vector3(...face.positions[1]);
        const p2 = new THREE.Vector3(...face.positions[2]);
        
        const normal = new THREE.Vector3();
        normal.crossVectors(p1.sub(p0), p2.sub(p0)).normalize(); 

        for (let i = 0; i < face.positions.length; ++i)
        {
            positions.push(...face.positions[i]);
            texcoords.push(...face.texturing[i]);
            texcoords.push(faceIndex); // third test coord
            normals.push(normal.x, normal.y, normal.z);
        }
    });

    const p = new THREE.BufferAttribute(new Float32Array(positions), 3);
    const t = new THREE.BufferAttribute(new Float32Array(texcoords), 3);
    const n = new THREE.BufferAttribute(new Float32Array(normals), 3);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", p);
    geometry.setAttribute("normal", n);
    geometry.setAttribute("uvSpecial", t);
    geometry.setIndex(indexes);

    geometry.translate(-.5, -.5, -.5);

    return geometry;
}

let debug;

async function start() {
    debug = document.getElementById("debug");
    const visible = document.getElementById("visible");
    const w = 320;
    const h = 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);

    const pivot = new THREE.Object3D();
    scene.add(pivot);

    pivot.position.set(0, 0, 0);
    pivot.add(camera);
    //pivot.position.y = 1;
    //pivot.rotation.x = -Math.PI / 8;

    pivot.rotation.order = "ZYX";

    camera.position.z = 5;

    const level = new THREE.Object3D();
    scene.add(level);

    const loader = new THREE.TextureLoader();

    const [crateTex, guyTex, guyFallTex] = await Promise.all([
        "crate.png",
        "guy-back.png",
        "guy-fall.png", 
    ].map((url) => loader.loadAsync(url)));

    const loads = {
        pillar: "pillar.png",
        orb: "orb.png",
        orbSmall: "orb-small.png",
        pointer: "pointer.png",
        compass: "compass.png",

        guyBack: "guy-back.png",
        guyFall: "guy-fall.png",

        enter: "enter.png",
        speak: "speak.png",
        tiles: "tiles.png",
    };

    const textures = Object.fromEntries(
        await Promise.all(Object.entries(loads).map(async ([key, url]) => [key, await loader.loadAsync(url)]))
    );

    const spriteMaterials = Object.fromEntries(Object.entries(textures).map(([key, texture]) => [key, new THREE.MeshBasicMaterial({ map: texture, alphaTest: .5, side: THREE.DoubleSide, })]));

    const geometries = {
        ramp: makeGeometry(ramp),
        slab: makeGeometry(slab),
        cube: makeGeometry(cube),
        quad: new THREE.PlaneGeometry(1, 1),
    };

    const dummy = new THREE.Mesh();

    const guy = new THREE.Mesh(geometries.quad, spriteMaterials.guyBack);
    const actionIcon = new THREE.Mesh(geometries.quad, spriteMaterials.speak);

    scene.add(actionIcon);

    // textures.tiles.magFilter = THREE.NearestFilter;
    // textures.tiles.minFilter = THREE.NearestFilter;

    const test = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, alphaTest: .5, map: textures.tiles });
    test.onBeforeCompile = shaderChanger2;
    
    function shaderChanger(shader) {
        shader.vertexShader = shader.vertexShader.replace(
            "#include <begin_vertex>", 
            "#include <begin_vertex>; transformed -= normal * 0.001;",
        );
    };

    function shaderChanger2(shader) {
        shader.uniforms.tileScale = { value: 1/16 };
        shader.vertexShader = shader.vertexShader.replace(
            "#include <common>", 
            "#include <common>\nuniform float tileScale; attribute float instanceTile; ",
        );
        shader.vertexShader = shader.vertexShader.replace(
            "#include <uv_vertex>", 
            "#include <uv_vertex>\nvUv.x += instanceTile; vUv.x *= tileScale;",
        );
        shader.vertexShader = shader.vertexShader.replace(
            "#include <project_vertex>", 
            "#include <project_vertex>\nmat3 invView = inverse(mat3(modelViewMatrix)); gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(invView * position, 1.0);",
        );
    };

    

    const blockMaterial = new THREE.MeshBasicMaterial({ 
        side: THREE.DoubleSide, 
        alphaTest: .5, 
        map: textures.tiles,
    });
    blockMaterial.onBeforeCompile = blockShapeShaderFixer;

    const cubeCount = 256;

    const renderers = {
        cube: new BlockShapeInstances(geometries.cube, blockMaterial, cubeCount), 
        ramp: new BlockShapeInstances(geometries.ramp, blockMaterial, cubeCount),
        slab: new BlockShapeInstances(geometries.slab, blockMaterial, cubeCount),
    }

    scene.add(renderers.cube.mesh);
    scene.add(renderers.ramp.mesh);
    scene.add(renderers.slab.mesh);

    const orbs = new THREE.InstancedMesh(geometries.quad, test, 128);
    orbs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const tiles = new THREE.InstancedBufferAttribute(new Float32Array(orbs.instanceMatrix.count), 1);
    geometries.quad.setAttribute("instanceTile", tiles);
    orbs.visible = false;

    for (let i = 0; i < tiles.count; ++i) {
        tiles.setX(i, THREE.MathUtils.randInt(0, 11));
    }
    
    const pointers = new THREE.InstancedMesh(geometries.quad, spriteMaterials.pointer, 128);
    pointers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    scene.add(orbs);
    scene.add(pointers);
    
    const kinematic = new KinematicGuy();

    const pointsVerts = [];
    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointsVerts, 3));
    const material = new THREE.LineBasicMaterial( { color: 0xFF00FF, depthTest: false, depthWrite: true } );
    const points = new THREE.LineSegments( pointsGeometry, material );
    points.name = "LINES"
    points.renderOrder = 1;
    scene.add(points);
    //test.uniforms.color.value = new THREE.Color(0xFF0000);
    //test.color = new THREE.Color(0xFF0000);

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(w, h);
    visible.appendChild(renderer.domElement);

    const dialogue = document.getElementById("dialogue");
    renderer.domElement.parentElement.append(dialogue);
    dialogue.hidden = true;

    const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFF00FF, 0x00FFFF, 0xFFFF00]

    const t = ["slab", "ramp", "cube", "ramp", "slab"]

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    window.addEventListener("pointermove", (event) => {
        pointer.set(event.clientX, event.clientY);
    });

    function getNormalisePointer() {
        const norm = new THREE.Vector2();
        const rect = renderer.domElement.getBoundingClientRect();
        norm.x = ((pointer.x - rect.x) / rect.width ) * 2 - 1;
        norm.y = ((pointer.y - rect.y) / rect.height) * 2 - 1;
        norm.y *= -1;

        return norm;
    }

    const compass = new THREE.Mesh(geometries.quad, spriteMaterials.compass);
    scene.add(compass);

    /** @type {THREE.Mesh[]} */
    const blocks = [];

    renderers.cube.count = 0;
    renderers.ramp.count = 0;
    renderers.slab.count = 0;

    leveldata.blocks.forEach((block, i) => {
        const [type, position, rotation = 0] = block;

        const cube = new THREE.Mesh(geometries[type], test);
        cube.position.set(...position);
        cube.rotation.setFromRotationMatrix(cubeOrientations[rotation]);
        
        cube.name = "block";

        level.add(cube);
        blocks.push(cube);

        cube.visible = false;
        const renderer = renderers[type];
        const index = renderer.count++;
        renderer.setPositionAt(index, cube.position);
        renderer.setRotationAt(index, rotation);
        renderer.setTilesAt(index, THREE.MathUtils.randInt(0, 255), THREE.MathUtils.randInt(0, 7));
    });

    /** @type {THREE.Mesh[]} */
    const billbs = [];

    leveldata.sprites.forEach((sprite, i) => {
        const { tile, position, vertical, text } = sprite;
        const billb = new THREE.Mesh(geometries.quad, spriteMaterials[tile]);
        billb.position.set(...position);
        level.add(billb);

        billb.userData.vert = vertical;
        billb.userData.text = text;
        billb.name = "sprite";

        billbs.push(billb);
    });

    billbs.push(guy);
    guy.userData.vert = true;
    level.add(guy);
    guy.position.setY(2);

    level.updateMatrixWorld();

    const triangles = [];
    blocks.forEach((block) => {
        const positions = block.geometry.getAttribute('position');
        const indexes = block.geometry.index.array;
        const m = block.matrix;

        for (let i = 0; i < indexes.length; i += 3) {
            const [i0, i1, i2] = [indexes[i+0], indexes[i+1], indexes[i+2]];
            const v0 = new THREE.Vector3(positions.getX(i0), positions.getY(i0), positions.getZ(i0));
            const v1 = new THREE.Vector3(positions.getX(i1), positions.getY(i1), positions.getZ(i1));
            const v2 = new THREE.Vector3(positions.getX(i2), positions.getY(i2), positions.getZ(i2));

            v0.applyMatrix4(m);
            v1.applyMatrix4(m);
            v2.applyMatrix4(m);

            triangles.push([v0, v1, v2]);
        }
    });

    kinematic.scene.triangles = triangles.map(([v0, v1, v2]) => new PhysicsTriangle(v0, v1, v2));
    kinematic.prevPosition.set(0, 2, 0);

    //const controls = new OrbitControls(camera, renderer.domElement);
    //controls.rotateSpeed = .25;

    const held = {};
    let pressed = {};
    
    const normals = [];

    orbs.count = 64;
    for (let i = 0; i < orbs.count; ++i) {
        dummy.position.set(
            (.5 - Math.random()) * 3, 
            (.5 - Math.random()) * 3, 
            (.5 - Math.random()) * 3,
        );
        dummy.updateMatrix();

        const color = new THREE.Color(Math.random(), Math.random(), Math.random());
        const normal = new THREE.Vector3(Math.random()-.5, Math.random()-.5, Math.random()-.5);
        normal.normalize();
        normals.push(normal);
    
        orbs.setMatrixAt(i, dummy.matrix);
        orbs.setColorAt(i, color);

        pointers.setMatrixAt(i, dummy.matrix);
        pointers.setColorAt(i, color);
    }

    orbs.instanceMatrix.needsUpdate = true;
    pointers.instanceMatrix.needsUpdate = true;

    const cameraQuat = new THREE.Quaternion();
    const forward = new THREE.Vector3();

    /**
     * @param {number[]} target
     * @param {THREE.Vector3} vector
     */
    function pushVector(target, vector) {
        target.push(vector.x, vector.y, vector.z);
    }

    function animate() {
        camera.getWorldDirection(forward);
        camera.getWorldQuaternion(cameraQuat);

        const { twist } = swingTwistDecompose(cameraQuat, new THREE.Vector3(0, 1, 0));

        let nearby;

        billbs.forEach((bilb) => {
            if (!bilb.userData.vert) {
                bilb.rotation.setFromQuaternion(cameraQuat);
            } else {
                bilb.rotation.setFromQuaternion(twist);
            }

            if (bilb === guy) return;

            if (bilb.userData.text && bilb.position.distanceTo(guy.position) < .8) {
                nearby = bilb;
            }
        });

        for (let i = 0; i < 1; ++i) {
            renderers.cube.setTileAt(
                THREE.MathUtils.randInt(0, renderers.cube.count),
                THREE.MathUtils.randInt(0, 7), THREE.MathUtils.randInt(0, 255), THREE.MathUtils.randInt(0, 7),
            );
            renderers.slab.setTileAt(
                THREE.MathUtils.randInt(0, renderers.slab.count),
                THREE.MathUtils.randInt(0, 7), THREE.MathUtils.randInt(0, 255), THREE.MathUtils.randInt(0, 7),
            );
            renderers.ramp.setTileAt(
                THREE.MathUtils.randInt(0, renderers.ramp.count),
                THREE.MathUtils.randInt(0, 7), THREE.MathUtils.randInt(0, 255), THREE.MathUtils.randInt(0, 7),
            );
        }
        renderers.cube.update();
        renderers.ramp.update();
        renderers.slab.update();

        if (nearby) actionIcon.position.copy(nearby.position).add(new THREE.Vector3(0, 1, 0));
        actionIcon.rotation.setFromQuaternion(twist);
        actionIcon.visible = dialogue.hidden && nearby !== undefined;

        pointsVerts.length = 0;
        for (let i = 0; i < orbs.count; ++i) {
            orbs.getMatrixAt(i, dummy.matrix);
            dummy.position.setFromMatrixPosition(dummy.matrix);
            dummy.rotation.setFromQuaternion(cameraQuat);
            dummy.updateMatrix();
            //orbs.setMatrixAt(i, dummy.matrix);

            const rotMatrix = new THREE.Matrix4();
            const normal = normals[i];
            const a = new THREE.Vector3();
            const b = new THREE.Vector3();

            a.crossVectors(normal, forward).normalize();
            b.crossVectors(a, normal).normalize();
            rotMatrix.makeBasis(a, normal, b);

            pointers.getMatrixAt(i, dummy.matrix);
            dummy.position.setFromMatrixPosition(dummy.matrix);
            dummy.rotation.setFromRotationMatrix(rotMatrix);
            dummy.updateMatrix();
            pointers.setMatrixAt(i, dummy.matrix);
        }
        orbs.instanceMatrix.needsUpdate = true;
        pointers.instanceMatrix.needsUpdate = true;

        renderer.render(scene, camera);

        // const norm = getNormalisePointer();
        // raycaster.setFromCamera(norm, camera);
        // const [first] = raycaster.intersectObject(level, true);

        const up = kinematic.upVector.clone();
        const left = forward.clone().cross(up).normalize();
        forward.crossVectors(up, left).normalize();

        if (kinematic.groundContacts.length > 0) {
            up.set(0, 0, 0);
            kinematic.groundContacts.forEach((contact) => up.add(contact.normal));
            up.divideScalar(kinematic.groundContacts.length);
            up.normalize();
        }

        left.crossVectors(forward, up);
        forward.crossVectors(up, left);
        const motionUp = left.clone().cross(forward);

        const test2 = new THREE.Matrix4();
        test2.makeBasis(left, forward, motionUp);

        compass.position.copy(kinematic.prevPosition);
        compass.rotation.setFromRotationMatrix(test2);

        const motion = new THREE.Vector3();

        if (held["w"]) motion.add(forward.clone().multiplyScalar(3));
        if (held["s"]) motion.add(forward.clone().multiplyScalar(-3));
        if (held["a"]) motion.add(left.clone().multiplyScalar(-3));
        if (held["d"]) motion.add(left.clone().multiplyScalar(3));
        if (held["ArrowLeft"]) pivot.rotation.y -= .02;
        if (held["ArrowRight"]) pivot.rotation.y += .02;
        if (held["ArrowUp"]) pivot.rotation.x -= .02;
        if (held["ArrowDown"]) pivot.rotation.x += .02;

        if (!dialogue.hidden && pressed["Enter"]) {
            dialogue.hidden = true;
        } else if (nearby && pressed["Enter"]) {
            dialogue.textContent = nearby.userData.text;
            dialogue.hidden = false;
        }

        kinematic.gravity = held["x"] ? 0 : 9;
        const jump = held[" "] && kinematic.hadGroundContact;

        pressed = {};

        kinematic.stepHeight = .55;

        // hack. cause: falling too fast correctly avoid bullet hole but doesn't
        // allow you to actually touch the ground
        const split = 3 - Math.floor(kinematic.gravityVelocity.y);
        if (dialogue.hidden)
            for (let i = 0; i < split; ++i)
                kinematic.move(motion, jump ? 5 : 0, 1/60/split);

        if (false) {
            kinematic.contacts.forEach((contact) => {
                pushVector(pointsVerts, contact.triangle.triangle.a);
                pushVector(pointsVerts, contact.triangle.triangle.b);
                pushVector(pointsVerts, contact.triangle.triangle.b);
                pushVector(pointsVerts, contact.triangle.triangle.c);
                pushVector(pointsVerts, contact.triangle.triangle.c);
                pushVector(pointsVerts, contact.triangle.triangle.a);
            });
        }

        pointers.visible = false;
        compass.visible = false;

        guy.material.map = kinematic.hadGroundContact ? guyTex : guyFallTex;

        if (kinematic.nextPosition.y < -5) {
            kinematic.nextPosition.y = 5;
            kinematic.prevPosition.copy(kinematic.nextPosition);
            guy.position.copy(kinematic.prevPosition).y += (.5 - kinematic.capsule.radius);
            pivot.position.copy(guy.position);
        }

        /** @param {THREE.Vector3} vector */
        function vec2str(vector) {
            return `${vector.x.toPrecision(2)},${vector.y.toPrecision(2)},${vector.z.toPrecision(2)}`
        }

        debug.textContent = `iterations: ${split} // pos: ${vec2str(kinematic.prevPosition)}`;

        guy.position.add(kinematic.nextPosition).y += (.5 - kinematic.capsule.radius);
        guy.position.multiplyScalar(.5);

        pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointsVerts, 3));

        //controls.target = pivot.position;
        pivot.position.lerp(guy.position, .25);
        //controls.update();

        requestAnimationFrame(animate);
    };

    animate();

    function update() {
        scaleElementToParent(visible);
        requestAnimationFrame(update);
    }
    update();

    window.addEventListener("keydown", (event) => {
        held[event.key] = true;
        pressed[event.key] = true;
    });

    window.addEventListener("keyup", (event) => {
        held[event.key] = false;
    });
}

/**
 * @param {THREE.Quaternion} rotation
 * @param {THREE.Vector3} axis
 */
function swingTwistDecompose(rotation, axis)
{
    const ra = new THREE.Vector3(rotation.x, rotation.y, rotation.z);
    const p = ra.projectOnVector(axis);

    const d = axis.dot(ra);

    const twist = new THREE.Quaternion(p.x, p.y, p.z, rotation.w).normalize();
    if (d < 0) {
        twist.x *= -1;
        twist.y *= -1;
        twist.z *= -1;
        twist.w *= -1;
    }
    const swing = rotation.clone().multiply(twist.clone().conjugate());

    return { swing, twist };
}
