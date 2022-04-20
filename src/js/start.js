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
        ["ramp", [ 0, -1,  1], [1, 2]],
        ["ramp", [-1, -1,  1], [-1, 0]],
        ["ramp", [-1, -1,  0], [0, 2]],

        ["cube", [-1,  0,  0]],
        ["cube", [ 0,  0,  0]],
        ["cube", [ 1,  0,  0]],
        ["slab", [ 1,  0, -1], [0, 2]],
        ["slab", [ 0,  0,  1]],
        ["slab", [ 1,  0,  1]],

        ["cube", [-1,  1,  0]],
        ["ramp", [ 0,  1,  0], [1, 0]],
        ["ramp", [-1,  1, -1], [0, 2]],

        ["cube", [-1,  2, -1]],
        ["ramp", [ 0,  2, -1], [1, 2]],

        ["slab", [ 0,  3, -1]],
    ],

    sprites: [
        ["pillar", [ 0, 3.5, -1], true],
        ["orb", [1,  1,  -1]],
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
            normals.push(normal.x, normal.y, normal.z);
        }
    });

    const p = new THREE.BufferAttribute(new Float32Array(positions), 3);
    const t = new THREE.BufferAttribute(new Float32Array(texcoords), 2);
    const n = new THREE.BufferAttribute(new Float32Array(normals), 3);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", p);
    geometry.setAttribute("normal", n);
    geometry.setAttribute("uv", t);
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

    const texture = new THREE.TextureLoader().load("crate.png");
    // texture.minFilter = THREE.NearestFilter;
    // texture.magFilter = THREE.NearestFilter;

    const pillarTex = new THREE.TextureLoader().load("pillar.png");
    // pillarTex.minFilter = THREE.NearestFilter;
    // pillarTex.magFilter = THREE.NearestFilter;

    const orbTex = new THREE.TextureLoader().load("orb.png");
    // orbTex.minFilter = THREE.NearestFilter;
    // orbTex.magFilter = THREE.NearestFilter;

    const guyTex = new THREE.TextureLoader().load("guy-back.png");
    const guyFallTex = new THREE.TextureLoader().load("guy-fall.png");
    const gridTex = new THREE.TextureLoader().load("grid.png");

    const geometries = {
        ramp: makeGeometry(ramp),
        slab: makeGeometry(slab),
        cube: makeGeometry(cube),
        quad: new THREE.PlaneGeometry(1, 1),
    };

    const materials = {
        pillar: new THREE.MeshBasicMaterial({
            map: pillarTex,
            alphaTest: .5,
        }),
        orb: new THREE.MeshBasicMaterial({
            map: orbTex,
            alphaTest: .5,
        }),
        guy: new THREE.MeshBasicMaterial({
            map: guyTex,
            alphaTest: .5,
        }),
        grid: new THREE.MeshBasicMaterial({
            map: gridTex,
            alphaTest: .5,
            //transparent: true,
            //opacity: .5,
        }),
    }

    const guy = new THREE.Mesh(geometries.quad, materials.guy);

    const test = new THREE.ShaderMaterial({
        uniforms: {
            map: { value: texture },
            color: { value: new THREE.Color(0xFFFFFF) },
        },
    
        vertexShader: `
varying vec2 vUv;
varying vec3 vNormal;

void main() {
    vUv = uv; 
    vNormal = normal;

    vec4 adjusted = vec4(position, 1);
    adjusted = vec4(position - normal*.0001, 1.0);
    vec4 modelViewPosition = modelViewMatrix * adjusted;
    gl_Position = projectionMatrix * modelViewPosition; 
}
        `.trim(),
        fragmentShader: `
        uniform sampler2D map; 
        uniform vec3 color;
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
            gl_FragColor = texture2D(map, vUv) * vec4(color*.75, 1);
            if (gl_FragColor.a < .5) discard;
        }
        `.trim(),

        side: THREE.DoubleSide,
        transparent: false,
    });

    const kinematic = new KinematicGuy();
    const radius = kinematic.capsule.radius;

    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 16, 8),
        materials.grid,
    );
    sphere.position.set(0, kinematic.capsule.radius, 1);
    
    scene.add(sphere);

    test.map = texture

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

    /** @type {THREE.Mesh[]} */
    const blocks = [];

    leveldata.blocks.forEach((block, i) => {
        const [type, position, rotation = [0, 0]] = block;

        const material = test.clone();
        const color = new THREE.Color(colors[(i+6) % 6]);

        material.color = color;
        material.uniforms.color = { value: color };

        const ry = rotation[0] * Math.PI / 2;
        const rx = rotation[1] * Math.PI / 2;

        const cube = new THREE.Mesh(geometries[type], material);
        cube.position.set(...position);
        cube.rotation.set(rx, ry, 0);
        
        cube.name = "block";

        level.add(cube);
        blocks.push(cube);
    });

    const billbs = [];

    leveldata.sprites.forEach((sprite, i) => {
        const [type, position, vert] = sprite;
        const billb = new THREE.Mesh(geometries.quad, materials[type]);
        billb.position.set(...position);
        level.add(billb);

        billb.userData.vert = vert;
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
    

    function animate() {
        requestAnimationFrame( animate );

        //cube.rotation.x += 0.01;
        //cube.rotation.y += 0.01;

        //pivot.rotation.y += 0.005;

        //sphere.position.z += 0.01;

        billbs.forEach((bilb) => {
            const q = camera.getWorldQuaternion(new THREE.Quaternion());
            
            if (!bilb.userData.vert) {
                bilb.rotation.setFromQuaternion(q);
            } else {
                const { twist } = swingTwistDecompose(q, new THREE.Vector3(0, 1, 0));
                bilb.rotation.setFromQuaternion(twist);
            }
        });

        //level.visible = false;
        renderer.render(scene, camera);

        // const norm = getNormalisePointer();
        // raycaster.setFromCamera(norm, camera);
        // const [first] = raycaster.intersectObject(level, true);

        pointsVerts.length = 0;

        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
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

        const origin = kinematic.nextPosition.clone();
        const forgin = origin.clone().add(forward);

        pointsVerts.push(
            origin.x, origin.y, origin.z,
            forgin.x, forgin.y, forgin.z,
        );

        forgin.copy(origin).add(left);

        pointsVerts.push(
            origin.x, origin.y, origin.z,
            forgin.x, forgin.y, forgin.z,
        );

        const motion = new THREE.Vector3();

        if (held["w"]) motion.add(forward.clone().multiplyScalar(3));
        if (held["s"]) motion.add(forward.clone().multiplyScalar(-3));
        if (held["a"]) motion.add(left.clone().multiplyScalar(-3));
        if (held["d"]) motion.add(left.clone().multiplyScalar(3));
        if (held["ArrowLeft"]) pivot.rotation.y -= .02;
        if (held["ArrowRight"]) pivot.rotation.y += .02;
        if (held["ArrowUp"]) pivot.rotation.x -= .02;
        if (held["ArrowDown"]) pivot.rotation.x += .02;

        kinematic.gravity = held["x"] ? 0 : 9;
        const jump = held[" "] && kinematic.hadGroundContact;
        
        kinematic.stepHeight = .5;

        // hack. cause: falling too fast correctly avoid bullet hole but doesn't
        // allow you to actually touch the ground
        const split = 4 - Math.floor(kinematic.gravityVelocity.y);
        for (let i = 0; i < split; ++i)
            kinematic.move(motion, jump ? 5 : 0, 1/60/split);

        kinematic.contacts.forEach((contact) => {
            const origin = contact.center;
            const point = contact.world;

            pointsVerts.push(
                origin.x, origin.y, origin.z,
                point.x, point.y, point.z,
            );

            pointsVerts.push(
                contact.triangle.p0.x, contact.triangle.p0.y, contact.triangle.p0.z,
                contact.triangle.p1.x, contact.triangle.p1.y, contact.triangle.p1.z,
            );

            pointsVerts.push(
                contact.triangle.p1.x, contact.triangle.p1.y, contact.triangle.p1.z,
                contact.triangle.p2.x, contact.triangle.p2.y, contact.triangle.p2.z,
            );

            pointsVerts.push(
                contact.triangle.p0.x, contact.triangle.p0.y, contact.triangle.p0.z,
                contact.triangle.p2.x, contact.triangle.p2.y, contact.triangle.p2.z,
            );
        });

        {
            const point = kinematic.lastStepUp;
            pointsVerts.push(
                point.x, point.y, point.z,
                point.x, point.y+.1, point.z,
            );
        }

        sphere.position.copy(kinematic.lastStepDown);
        sphere.scale.set(1, 1, 1).multiplyScalar(4 * kinematic.capsule.radius);
        sphere.visible = true;

        guy.material.map = kinematic.hadGroundContact ? guyTex : guyFallTex;

        if (kinematic.nextPosition.y < -5) {
            kinematic.nextPosition.y = 5;
            kinematic.prevPosition.copy(kinematic.nextPosition);
        }

        debug.textContent = `gravity: ${kinematic.gravityVelocity.y} / jump: ${kinematic.jumpVelocity.x},${kinematic.jumpVelocity.y},${kinematic.jumpVelocity.z}`;

        guy.position.add(kinematic.nextPosition).y += (.5 - kinematic.capsule.radius);
        guy.position.multiplyScalar(.5);
        //ssphere.visible = false;
        //guy.visible = false;

        pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointsVerts, 3));

        //controls.target = pivot.position;
        pivot.position.lerp(guy.position, .25);
        //controls.update();
    };

    animate();

    function update() {
        scaleElementToParent(visible);
        requestAnimationFrame(update);
    }
    update();

    window.addEventListener("keydown", (event) => {
        held[event.key] = true;
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
    const p = ra.clone().projectOnVector(axis);

    const twist = new THREE.Quaternion(p.x, p.y, p.z, rotation.w);
    twist.normalize();

    const swing = rotation.clone().multiply(twist.clone().conjugate());

    return { swing, twist };
}
