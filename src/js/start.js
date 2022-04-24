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

        ["wedgeH", [-2, 1, 0], 22],
        ["wedgeB", [-2, 0, 0], 22],

        ["wedgeH", [-3, 4, 0], 18],
        ["wedgeB", [-3, 3, 0], 18],

        ["cube", [-1,  1,  0]],
        ["ramp", [ 0,  1,  0], 10],
        ["ramp", [-1,  1, -1], 13],

        ["cube", [-1,  2, -1]],
        ["ramp", [ 0,  2, -1], 14],

        ["slab", [ 0,  3, -1], 8],
    ],

    sprites: [
        { tile: 8, position: [ 0, 3.5, -1], vertical: true, text: "so refined.."},
        { tile: 6, position: [1,  1,  -1], text: "I AM ORB." },
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

async function start() {
    const debug = document.getElementById("debug");
    const visible = document.getElementById("visible");
    const w = 320;
    const h = 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.setZ(5);

    const pivot = new THREE.Object3D();
    scene.add(pivot);

    pivot.position.set(0, 0, 0);
    pivot.rotation.order = "ZYX";
    pivot.add(camera);

    const level = new THREE.Object3D();
    scene.add(level);

    const guyBackTile = 4;
    const guyFallTile = 5;
    const speakTile = 10;

    const loader = new THREE.TextureLoader();
    const tilesTex = await loader.loadAsync("tiles.png");

    tilesTex.magFilter = THREE.NearestFilter;
    tilesTex.minFilter = THREE.NearestFilter;

    const geometries = {
        ramp: makeGeometry(ramp),
        slab: makeGeometry(slab),
        cube: makeGeometry(cube),
        wedgeH: makeGeometry(wedgeHead),
        wedgeB: makeGeometry(wedgeBody),
    };
    const quad = new THREE.PlaneGeometry(1, 1);

    const guy = new THREE.Mesh(quad, undefined);
    guy.visible = false;

    const blockMaterial = new THREE.MeshBasicMaterial({ 
        side: THREE.DoubleSide, 
        alphaTest: .5, 
        map: tilesTex,
    });
    blockMaterial.onBeforeCompile = blockShapeShaderFixer;

    const spriteMaterial = blockMaterial.clone();

    const cubeCount = 4096;

    const renderers = new Map(Object.entries(geometries).map(([key, geometry]) => [key, new BlockShapeInstances(geometry, blockMaterial, cubeCount)]));

    const billboards = new BillboardInstances(quad, spriteMaterial, cubeCount);

    for (const renderer of renderers.values()) {
        scene.add(renderer.mesh);
    }
    scene.add(billboards.mesh);
    
    const kinematic = new KinematicGuy();

    const pointsVerts = [];
    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointsVerts, 3));
    const material = new THREE.LineBasicMaterial( { color: 0xFF00FF, depthTest: false, depthWrite: true } );
    const points = new THREE.LineSegments( pointsGeometry, material );
    points.name = "LINES"
    points.renderOrder = 1;
    points.frustumCulled = false;
    scene.add(points);

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(w, h);
    visible.appendChild(renderer.domElement);

    const dialogue = document.getElementById("dialogue");
    renderer.domElement.parentElement.append(dialogue);
    dialogue.hidden = true;
    
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

    leveldata.blocks.forEach((block, i) => {
        const [type, position, rotation = 0] = block;
        const renderer = renderers.get(type);

        for (let y = 0; y < 3; ++y) {
            for (let x = 0; x < 3; ++x) {
                const index = renderer.count++;
                renderer.setPositionAt(index, new THREE.Vector3(...position).add(new THREE.Vector3(x*5, 0, y*3)));
                renderer.setRotationAt(index, rotation);
                renderer.setTilesAt(index, THREE.MathUtils.randInt(0, 255), THREE.MathUtils.randInt(0, 7));
            }
        }
    });

    const types = Array.from(renderers.keys());
    for (let z = 0; z < 16; ++z) {
        for (let y = 0; y < 16; ++y) {
            for (let x = 0; x < 16; ++x) {
                const type = types[THREE.MathUtils.randInt(0, types.length - 1)];
                const renderer = renderers.get(type);

                const index = renderer.count++;
                renderer.setPositionAt(index, new THREE.Vector3(x, -3-z, y));
                renderer.setRotationAt(index, THREE.MathUtils.randInt(0, 7));
                renderer.setTilesAt(index, THREE.MathUtils.randInt(0, 255), THREE.MathUtils.randInt(0, 7));
            }
        }
    }
    
    /** @type {THREE.Object3D[]} */
    const billbs = [];

    const guyIndex = billboards.count++;
    billboards.setAxisAt(guyIndex, new THREE.Vector3(0, 1, 0), true);

    const promptIndex = billboards.count++;
    billboards.setAxisAt(promptIndex, new THREE.Vector3(0, 1, 0), true);

    leveldata.sprites.forEach((sprite, i) => {
        const { tile, position, vertical, text } = sprite;
        const billb = new THREE.Object3D();
        billb.position.set(...position);
        billb.userData.vert = vertical;
        billb.userData.text = text;
        billbs.push(billb);

        const index = billboards.count++;
        billboards.setPositionAt(index, billb.position);
        billboards.setAxisAt(index, new THREE.Vector3(0, 1, 0), vertical);
        billboards.setTileAt(index, tile);
    });
    billboards.update();

    billbs.push(guy);
    guy.userData.vert = true;
    level.add(guy);
    guy.position.setY(2);

    level.updateMatrixWorld();
    
    kinematic.prevPosition.set(0, 2, 0);

    const held = {};
    let pressed = {};

    const cameraQuat = new THREE.Quaternion();
    const forward = new THREE.Vector3();

    /**
     * @param {number[]} target
     * @param {THREE.Vector3} vector
     */
    function pushVector(target, vector) {
        target.push(vector.x, vector.y, vector.z);
    }

    /**
     * @param {number[]} target
     * @param {THREE.Triangle} triangle
     */
    function pushTriangle(target, triangle) {
        pushVector(target, triangle.a);
        pushVector(target, triangle.b);
        pushVector(target, triangle.b);
        pushVector(target, triangle.c);
        pushVector(target, triangle.c);
        pushVector(target, triangle.a);
    }

    function animate() {
        const rs = Array.from(renderers.values());

        for (let i = 0; i < 4; ++i) {
            for (const renderer of rs) {
                renderer.setTileAt(
                    THREE.MathUtils.randInt(0, renderer.count),
                    THREE.MathUtils.randInt(0, 7), THREE.MathUtils.randInt(0, 255), THREE.MathUtils.randInt(0, 7),
                );
            }
        }
    
        rs.forEach((r) => r.update());
        billboards.update();

        const nearby = billbs.find((bilb) => bilb !== guy && bilb.userData.text && bilb.position.distanceTo(guy.position) < .8);

        if (nearby && dialogue.hidden) {
            billboards.setPositionAt(promptIndex, new THREE.Vector3().copy(nearby.position).add(new THREE.Vector3(0, 1, 0)));
            billboards.setTileAt(promptIndex, speakTile);
        } else {
            billboards.setPositionAt(promptIndex, new THREE.Vector3(0, 1, 0));
        }

        renderer.render(scene, camera);

        // const norm = getNormalisePointer();
        // raycaster.setFromCamera(norm, camera);
        // const [first] = raycaster.intersectObject(level, true);

        camera.getWorldDirection(forward);
        camera.getWorldQuaternion(cameraQuat);
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

        const motion = new THREE.Vector3();

        if (held["w"]) motion.add(forward.clone().multiplyScalar(3));
        if (held["s"]) motion.add(forward.clone().multiplyScalar(-3));
        if (held["a"]) motion.add(left.clone().multiplyScalar(-3));
        if (held["d"]) motion.add(left.clone().multiplyScalar(3));
        if (held["ArrowLeft"]) pivot.rotation.y -= .03;
        if (held["ArrowRight"]) pivot.rotation.y += .03;
        if (held["ArrowUp"]) pivot.rotation.x -= .03;
        if (held["ArrowDown"]) pivot.rotation.x += .03;

        pivot.rotation.x = THREE.MathUtils.clamp(pivot.rotation.x, -Math.PI/4, Math.PI/4);

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

        const bounds = new THREE.Box3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
        ).expandByScalar(.5);
        bounds.min.add(kinematic.prevPosition);
        bounds.max.add(kinematic.prevPosition);

        kinematic.scene.triangles.length = 0;
        for (const renderer of renderers.values()) {
            renderer.getTrianglesInBounds(bounds, kinematic.scene.triangles);
        }

        // hack. cause: falling too fast correctly avoid bullet hole but doesn't
        // allow you to actually touch the ground
        const split = 3 - Math.floor(kinematic.gravityVelocity.y);
        if (dialogue.hidden)
            for (let i = 0; i < split; ++i)
                kinematic.move(motion, jump ? 5 : 0, 1/60/split);

        // kinematic.contacts.forEach((contact) => {
        //     pushTriangle(pointsVerts, contact.triangle.triangle);
        // });
        kinematic.scene.triangles.forEach((triangle) => pushTriangle(pointsVerts, triangle.triangle));

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

        billboards.setPositionAt(guyIndex, guy.position);
        billboards.setTileAt(guyIndex, kinematic.hadGroundContact ? guyBackTile : guyFallTile);

        pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointsVerts, 3));
        pointsVerts.length = 0;

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
