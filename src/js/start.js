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

function randomDesign(tile = undefined, rot = undefined) {
    const design = [];

    tile = tile ?? THREE.MathUtils.randInt(0, 64);
    rot = rot ?? THREE.MathUtils.randInt(0, 7);

    for (let f = 0; f < 4; ++f) {
        for (let s = 0; s < 8; ++s) {
            design.push(tile*4+f, rot);
        }
    }
    return design;
}

function repeatDesign(design) {
    return [...design, ...design, ...design, ...design];
}

function boxDesign(top, side) {
    return repeatDesign([top, 0, top, 0, side, 0, side, 0, side, 0, side, 0, side, 0, side, 0]);
}

function animatedDesign(...frames) {
    const design = [];
    for (const [tile, rot] of frames) {
        for (let s = 0; s < 8; ++s) {
            design.push(tile, rot);
        }
    }
    return design;
}

const leveldata = {
    blocks: [
        ["ramp", [ 0, -1,  1], 9],
        ["ramp", [-1, -1,  1], 3],
        ["ramp", [-1, -1,  0], 10],

        ["cube", [-1,  0,  0]],
        ["cube", [ 0,  0,  0]],
        ["cube", [ 1,  0,  0]],
        ["slab", [ 1,  0, -1], 8],
        ["slab", [ 0,  0,  1], 0],
        ["slab", [ 1,  0,  1], 0],

        ["wedgeHead", [-2, 1, 0], 20],
        ["wedgeBody", [-2, 0, 0], 20],

        ["wedgeHead", [-2, 3, 0], 12],
        ["wedgeBody", [-3, 4, 0], 12],

        ["cube", [-1,  1,  0]],
        ["ramp", [ 0,  1,  0], 1],
        ["ramp", [-1,  1, -1], 10],

        ["cube", [-1,  2, -1]],
        ["ramp", [ 0,  2, -1], 9],

        ["slab", [ 0,  3, -1], 0],

        ["wedgeHead", [3, 0, 1], 0],
        ["wedgeBody", [3, 0, 0], 0],
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
    const faces = [];

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
            faces.push(faceIndex);
            normals.push(normal.x, normal.y, normal.z);
        }
    });

    const p = new THREE.BufferAttribute(new Float32Array(positions), 3);
    const t = new THREE.BufferAttribute(new Float32Array(texcoords), 2);
    const n = new THREE.BufferAttribute(new Float32Array(normals), 3);
    const f = new THREE.BufferAttribute(new Float32Array(faces), 1);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", p);
    geometry.setAttribute("normal", n);
    geometry.setAttribute("uv", t);
    geometry.setAttribute("face", f);
    geometry.setIndex(indexes);

    geometry.translate(-.5, -.5, -.5);

    return geometry;
}

async function start() {
    const stats = Stats()
    document.body.appendChild(stats.dom)

    const debug = document.getElementById("debug");
    const visible = document.getElementById("visible");
    const w = 320*2;
    const h = 240*2;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(w, h);
    document.getElementById("renderer").appendChild(renderer.domElement);

    const dialogue = document.getElementById("dialogue");
    renderer.domElement.parentElement.append(dialogue);
    dialogue.hidden = true;

    const blockShapeSelect = ui.radio("block-shape");
    blockShapeSelect.selectedIndex = 0;

    // camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.setZ(5);

    const pivot = new THREE.Object3D();
    scene.add(pivot);

    pivot.position.set(0, 0, 0);
    pivot.rotation.order = "ZYX";
    pivot.add(camera);

    // level
    const level = new THREE.Object3D();
    scene.add(level);

    const guyBackTile = 4;
    const guyFallTile = 5;
    const speakTile = 10;

    const loader = new THREE.TextureLoader();
    const tilesTex = await loader.loadAsync("tiles.png");
    tilesTex.magFilter = THREE.NearestFilter;
    tilesTex.minFilter = THREE.NearestFilter;
    tilesTex.generateMipmaps = false;

    const geometries = {
        ramp: makeGeometry(ramp),
        slab: makeGeometry(slab),
        cube: makeGeometry(cube),
        wedgeHead: makeGeometry(wedgeHead),
        wedgeBody: makeGeometry(wedgeBody),
    };

    const kinematic = new KinematicGuy();
    const guy = new THREE.Object3D();

    /**
     * @typedef {Object} BlockDesign
     * @property {string} name
     * @property {number[]} data
     * @property {number} thumb
     */

    /** @type {BlockDesign[]} */
    const designs = [];

    designs.push({ name: "cave", thumb: 13, data: boxDesign(31, 13) });
    designs.push({ name: "fan", thumb: 20, data:  animatedDesign([20, 0], [21, 0], [20, 1], [21, 1])});
    designs.push({ name: "meat", thumb: 16, data: randomDesign(4) });
    designs.push({ name: "water", thumb: 14, data: animatedDesign([14, 0], [14, 4], [14, 0], [14, 4]) });

    for (let i = 0; i < 16; ++i) {
        const tile = THREE.MathUtils.randInt(32, 96);
        const data = repeatDesign([tile, 0, tile, 0, tile, 0, tile, 0, tile, 0, tile, 0, tile, 0, tile, 0]);
        designs.push({ name: `random ${i}`, thumb: tile, data });
    }

    const blockDesignData = new BlockDesignData(8, 4, designs.length);
    designs.forEach((design, i) => blockDesignData.setDesignAt(i, design.data));

    // const options = designs.map((design, i) => html("option", { title: design.name }, design.name));
    // blockDesignSelect.replaceChildren(...options);
    // blockDesignSelect.selectedIndex = 0;

    async function getCanvasBlob(canvas) {
        return new Promise((resolve, reject) => {
            canvas.toBlob(resolve);
        });
    } 

    const canvas = html("canvas", { width: tilesTex.image.width, height: tilesTex.image.height });
    const ctx = canvas.getContext("2d");
    ctx.drawImage(tilesTex.image, 0, 0);
    const blob = await getCanvasBlob(canvas);
    const src = URL.createObjectURL(blob);

    const designSelect = document.querySelector("#design-select");
    const tileToggleTemplate = designSelect.querySelector("label");

    tileToggleTemplate.remove();

    designs.forEach((design) => {
        const x = -design.thumb % 16;
        const y = 512 + 32 * (1 + Math.floor(design.thumb / 16));

        const toggle = tileToggleTemplate.cloneNode(true);
        toggle.querySelector("input").style = `background: url(${src}); background-position: ${x*16*2}px ${y}px; background-size: 512px`;
        designSelect.append(toggle);
    });

    const blockDesignSelect = ui.radio("design-select");
    blockDesignSelect.selectedIndex = 0;

    const blockMaterial = new THREE.MeshBasicMaterial({ 
        side: THREE.DoubleSide, 
        alphaTest: .5, 
        map: tilesTex,
    });
    blockMaterial.onBeforeCompile = function (shader) {
        blockMaterial.uniforms = shader.uniforms;
        blockShapeShaderFixer(shader);
        shader.uniforms.blockDesigns.value = blockDesignData;
    }

    function makeSelectionCube() {
        const selectCubeGeo = new THREE.BoxGeometry();
        const selectCubeMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, alphaTest: .5, map: tilesTex });
        const selectCubeMes = new THREE.Mesh(selectCubeGeo, selectCubeMat);
    
        const uvs1 = selectCubeGeo.getAttribute("uv");
        function remap(uvs, i, tile) {
            const col = tile % 16;
            const row = (tile / 16) | 0;
            let [x, y] = [uvs.getX(i), uvs.getY(i)]; 
            x = (x + col) / 16;
            y = (y + row) / 16;
            uvs.setXY(i, x, y);
        }
        for (let i = 0; i < 8; ++i) remap(uvs1, i, 7);
        for (let i = 12; i < uvs1.count; ++i) remap(uvs1, i, 7);
        for (let i = 8; i < 12; ++i) remap(uvs1, i, 2);
        selectCubeMes.position.set(0, 0, 1);
        selectCubeMes.scale.multiplyScalar(1.01);

        return selectCubeMes;
    }
    const selectionCube = makeSelectionCube();
    scene.add(selectionCube);
    //selectCubeMes.visible = false;

    const spriteMaterial = blockMaterial.clone();

    const cubeCount = 4096;
    const renderers = new Map(Object.entries(geometries).map(([key, geometry]) => [key, new BlockShapeInstances(geometry, blockMaterial, cubeCount)]));
    const blockMap = new BlockMap(renderers);
    const billboards = new BillboardInstances(new THREE.PlaneGeometry(1, 1), spriteMaterial, cubeCount);

    level.add(blockMap);
    level.add(billboards);

    // points
    const pointsVerts = [];
    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointsVerts, 3));
    const material = new THREE.LineBasicMaterial( { color: 0xFF00FF, depthTest: false, depthWrite: true } );
    const points = new THREE.LineSegments( pointsGeometry, material );
    points.name = "LINES"
    points.renderOrder = 1;
    points.frustumCulled = false;
    scene.add(points);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function getNormalisePointer() {
        const norm = new THREE.Vector2();
        const rect = renderer.domElement.getBoundingClientRect();
        norm.x = ((pointer.x - rect.x) / rect.width ) * 2 - 1;
        norm.y = ((pointer.y - rect.y) / rect.height) * 2 - 1;
        norm.y *= -1;

        return norm;
    }

    const types = Array.from(Object.keys(geometries));
    leveldata.blocks.forEach((block, i) => {
        const [type, position, rotation = 0] = block;
        blockMap.setBlockAt(new THREE.Vector3(...position), type, rotation);
    });
    
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
        billboards.setTileAt(index, tile, 0);
    });

    function addRandomGuy(position) {
        const index = billboards.count++;
        billboards.setPositionAt(index, position);
        billboards.setAxisAt(index, new THREE.Vector3(0, 1, 0), true);
        billboards.setTileAt(index, THREE.MathUtils.randInt(255-31, 255), 0);
    }

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

    let frame = 0;
    let timer = 0;

    let blockTemplate = {
        type: "cube",
        rotation: 0,
        design: 0,
    }

    let hoveredBlock = {
        mesh: /** @type {BlockShapeInstances} */ (undefined),
        normal: new THREE.Vector3(),
        instanceId: 0,
    };

    function animate() {
        if (blockMaterial.uniforms) blockMaterial.uniforms.frame.value = frame;
        if (timer == 0) frame = (frame + 1) % 4;

        timer = (timer + 1) % 20;
        
        // if (timer === 0) {
        //     const position = new THREE.Vector3(
        //         THREE.MathUtils.randInt(-9, 9),
        //         THREE.MathUtils.randInt(-9,-1),
        //         THREE.MathUtils.randInt(-9, 9),
        //     );

        //     blockMap.setBlockAt(
        //         position, 
        //         types[THREE.MathUtils.randInt(0, types.length - 1)],
        //         THREE.MathUtils.randInt(0, 7),
        //         THREE.MathUtils.randInt(0, designs.length - 1),
        //     );

        //     if (Math.random() < .1) {
        //         addRandomGuy(position.setY(position.y + 1));
        //     }
        // }
    
        billboards.update();

        const nearby = billbs.find((bilb) => bilb !== guy && bilb.userData.text && bilb.position.distanceTo(guy.position) < 1.2);

        if (nearby && dialogue.hidden) {
            billboards.setPositionAt(promptIndex, new THREE.Vector3().copy(nearby.position).add(new THREE.Vector3(0, 1, 0)));
            billboards.setTileAt(promptIndex, speakTile);
        } else {
            billboards.setTileAt(promptIndex, 0);
        }

        renderer.render(scene, camera);

        const norm = getNormalisePointer();
        raycaster.setFromCamera(norm, camera);
        const [first] = raycaster.intersectObjects([level, selectionCube], true);

        if (first) {
            if (first.object === selectionCube) {
                const normalMatrix = new THREE.Matrix3().getNormalMatrix(first.object.matrixWorld);
                hoveredBlock.normal.fromBufferAttribute(selectionCube.geometry.getAttribute("normal"), first.face.a);
                hoveredBlock.normal.applyNormalMatrix(normalMatrix);

                const orthoIndex = orthoNormals.findIndex((o) => o.distanceToSquared(hoveredBlock.normal) < 0.1);
                const quat = orthoOrients[orthoIndex];
                selectionCube.rotation.setFromQuaternion(quat);
            } else if (first.object === billboards) {
                const mesh = /** @type {BillboardInstances} */ (first.object);
                mesh.getFaceTriangles(first.instanceId).forEach((triangle) => pushTriangle(pointsVerts, triangle));

                if (pressed["Mouse"]) {
                    mesh.setTileAt(first.instanceId, THREE.MathUtils.randInt(0, 255), THREE.MathUtils.randInt(0, 7));
                }
            } else {
                const mesh = /** @type {BlockShapeInstances} */ (first.object);
                
                const face = mesh.getFaceIndex(first.faceIndex);
                //mesh.getFaceTriangles(first.instanceId, face).forEach((triangle) => pushTriangle(pointsVerts, triangle));

                hoveredBlock.mesh = mesh;
                hoveredBlock.instanceId = first.instanceId;

                if (pressed["Mouse"]) {
                    const prev = mesh.getRotationAt(first.instanceId);
                    const next = S4Ops[0][prev];
                    mesh.setRotationAt(first.instanceId, next); 
                }
            }
        } else {
            hoveredBlock.mesh = undefined;
        }

        selectionCube.visible = hoveredBlock.mesh !== undefined;
        selectionCube.scale.set(1.01, 1.01, 1.01).multiplyScalar(hoveredBlock.mesh ? 1 : 0);

        if (hoveredBlock.mesh) {
            const { mesh, instanceId, normal } = hoveredBlock;

            mesh.getPositionAt(instanceId, selectionCube.position);

            if (pressed["MouseLeft"]) {
                const base = new THREE.Vector3();
                mesh.getPositionAt(instanceId, base);

                if (!held["Alt"]) {
                    const pos = base.clone().add(normal).round();
                    blockMap.setBlockAt(
                        pos, 
                        blockShapeSelect.value,
                        blockTemplate.rotation,
                        blockDesignSelect.selectedIndex,
                    );
                } else {
                    blockTemplate = blockMap.getBlockAt(base);
                    blockShapeSelect.setValueSilent(blockTemplate.type);
                    blockDesignSelect.selectedIndex = blockTemplate.design;
                }
            }

            if (pressed["MouseRight"]) {
                const base = new THREE.Vector3();
                mesh.getPositionAt(instanceId, base);
                blockMap.delBlockAt(base);
                hoveredBlock.mesh = undefined;
            }

            if (pressed["A"]) {
                const prev = mesh.getRotationAt(instanceId);
                const next = S4Ops[0][prev];
                mesh.setRotationAt(instanceId, next); 
            }

            if (pressed["D"]) {
                const prev = mesh.getRotationAt(instanceId);
                const next = S4Ops[2][prev];
                mesh.setRotationAt(instanceId, next); 
            }

            if (pressed["Q"]) {
                const prev = mesh.getRotationAt(instanceId);
                const next = S4Ops[1][prev];
                mesh.setRotationAt(instanceId, next); 
            }

            if (pressed["E"]) {
                const prev = mesh.getRotationAt(instanceId);
                const next = S4Ops[4][prev];
                mesh.setRotationAt(instanceId, next); 
            }

            if (pressed["W"]) {
                const prev = mesh.getRotationAt(instanceId);
                const next = S4Ops[5][prev];
                mesh.setRotationAt(instanceId, next); 
            }

            if (pressed["S"]) {
                const prev = mesh.getRotationAt(instanceId);
                const next = S4Ops[3][prev];
                mesh.setRotationAt(instanceId, next); 
            }

            mesh.update();
        }

        camera.getWorldDirection(billboards.cameraWorldDirection);

        camera.getWorldDirection(forward);
        camera.getWorldQuaternion(cameraQuat);
        const up = kinematic.upVector.clone();
        const left = forward.clone().cross(up).normalize();
        forward.crossVectors(up, left).normalize();

        // move according to slope of ground
        if (kinematic.groundContacts.length > 0) {
            up.set(0, 0, 0);
            kinematic.groundContacts.forEach((contact) => up.add(contact.normal));
            up.divideScalar(kinematic.groundContacts.length);
            up.normalize();
        }

        left.crossVectors(forward, up);
        forward.crossVectors(up, left);

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
        blockMap.getTrianglesInBounds(bounds, kinematic.scene.triangles);

        // hack. cause: falling too fast correctly avoid bullet hole but doesn't
        // allow you to actually touch the ground
        const split = 3 - Math.floor(kinematic.gravityVelocity.y);
        if (dialogue.hidden)
            for (let i = 0; i < split; ++i)
                kinematic.move(motion, jump ? 5 : 0, 1/60/split);

        // kinematic.contacts.forEach((contact) => pushTriangle(pointsVerts, contact.triangle.triangle));
        // kinematic.scene.triangles.forEach((triangle) => pushTriangle(pointsVerts, triangle.triangle));

        if (kinematic.nextPosition.y < -9) {
            kinematic.nextPosition.y = 5;
            kinematic.prevPosition.copy(kinematic.nextPosition);
            guy.position.copy(kinematic.prevPosition).y += (.5 - kinematic.capsule.radius);
            pivot.position.copy(guy.position);
        }

        guy.position.add(kinematic.nextPosition).y += (.5 - kinematic.capsule.radius);
        guy.position.multiplyScalar(.5);

        billboards.setPositionAt(guyIndex, guy.position);
        billboards.setTileAt(guyIndex, kinematic.hadGroundContact ? guyBackTile : guyFallTile);

        pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointsVerts, 3));
        pointsVerts.length = 0;

        pivot.position.lerp(guy.position, .25);

        requestAnimationFrame(animate);

        stats.update();  
    };

    animate();

    function update() {
        scaleElementToParent(visible);
        requestAnimationFrame(update);
    }
    update();

    window.addEventListener("pointermove", (event) => {
        pointer.set(event.clientX, event.clientY);
    });

    window.addEventListener("pointerdown", (event) => {
        pointer.set(event.clientX, event.clientY);
        held["Mouse"] = true;
        pressed["Mouse"] = true;
    });

    window.addEventListener("pointerup", (event) => {
        pointer.set(event.clientX, event.clientY);
        held["Mouse"] = false;
    });

    renderer.domElement.addEventListener("mousedown", (event) => {
        if (event.button === 0) pressed["MouseLeft"] = true;
        if (event.button === 2) pressed["MouseRight"] = true;
    })

    window.addEventListener("contextmenu", (event) => {
        event.preventDefault();
    });

    window.addEventListener("keydown", (event) => {
        held[event.key] = true;
        pressed[event.key] = true;

        if (event.key.includes("Arrow")) event.preventDefault();
    });

    window.addEventListener("keyup", (event) => {
        held[event.key] = false;
    });
}

function vec2key(vector) {
    return this.xyz2key(vector.x, vector.y, vector.z);
}

function xyz2key(x, y, z) {
    return `${x|0},${y|0},${z|0}`;
}

class BlockMap extends THREE.Object3D {
    /** @type {Map<string, { type: string, index: number }>} */
    blocks = new Map();
    /** @type {Map<string, BlockShapeInstances>} */
    meshes = new Map();

    /**
     * @param {Map<string, BlockShapeInstances>} renderers
     */
    constructor(renderers) {
        super();

        renderers.forEach((mesh, type) => {
            this.meshes.set(type, mesh);
            this.add(mesh);
        });
    }

    /**
     * @param {THREE.Vector3} position
     * @param {string} type 
     */
    setBlockAt(position, type, rotation=0, design=0) {
        this.delBlockAt(position);

        const mesh = this.meshes.get(type);
        const index = mesh.count++;
        mesh.setPositionAt(index, position);
        mesh.setRotationAt(index, rotation);
        mesh.setDesignAt(index, design);
        mesh.update();

        this.blocks.set(vec2key(position), { type, index });
    }

    getBlockAt(position) {
        const block = this.blocks.get(vec2key(position));
        if (!block) return undefined;

        const mesh = this.meshes.get(block.type);

        return {
            type: block.type,
            rotation: mesh.getRotationAt(block.index),
            design: mesh.getDesignAt(block.index),
        }
    }

    delBlockAt(position) {
        const block = this.blocks.get(vec2key(position));
        if (!block) return;

        const mesh = this.meshes.get(block.type);
        const relocated = mesh.delAllAt(block.index);
        this.blocks.delete(vec2key(position));

        // update index of relocated block
        if (relocated) {
            const lastPos = new THREE.Vector3();
            mesh.getPositionAt(block.index, lastPos);
            this.getBlockAt(lastPos).index = block.index;
            mesh.update();
        }
    }

    /**
     * @param {THREE.Box3} bounds
     * @param {PhysicsTriangle[]} target
     */
    getTrianglesInBounds(bounds, target) {
        this.meshes.forEach((mesh) => mesh.getTrianglesInBounds(bounds, target));
    }
}
