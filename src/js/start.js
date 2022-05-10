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

async function start() {
    /** @type {BlocksDataProject} */
    const data = JSON.parse(document.querySelector("#editor-embed").textContent);
    const tilesImage = await loadImage(data.tileset);

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

    ONE("[name='sprite-create']").addEventListener("click", () => placingSprite = createSprite);
    ONE("[name='sprite-deselect']").addEventListener("click", () => deselectSprite());
    ONE("[name='sprite-delete']").addEventListener("click", () => deleteSprite());
    ONE("[name='sprite-move']").addEventListener("click", () => placingSprite = moveSprite);

    const modeSelect = ui.radio("mode-select");

    modeSelect.tab(ONE("#block-controls"), "blocks");
    modeSelect.tab(ONE("#sprite-controls"), "sprites");

    const blockShapeSelect = ui.radio("block-shape");
    blockShapeSelect.selectedIndex = 0;

    modeSelect.selectedIndex = 0;

    // camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.setZ(5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.mouseButtons.LEFT = -1;
    controls.mouseButtons.MIDDLE = -1;
    controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
    controls.enablePan = false;
    controls.rotateSpeed = .5;

    // level
    const level = new THREE.Object3D();
    scene.add(level);

    const guyBackTile = 4;
    const guyFallTile = 5;
    const speakTile = 10;

    const tilesTex = new THREE.Texture(tilesImage);
    tilesTex.magFilter = THREE.NearestFilter;
    tilesTex.minFilter = THREE.NearestFilter;
    tilesTex.generateMipmaps = false;
    tilesTex.needsUpdate = true;

    const geometries = {
        ramp: makeGeometry(ramp),
        slab: makeGeometry(slab),
        cube: makeGeometry(cube),
        wedgeHead: makeGeometry(wedgeHead),
        wedgeBody: makeGeometry(wedgeBody),
    };

    const kinematic = new KinematicGuy();
    const guy = new THREE.Object3D();

    /** @type {BlocksDataDesign[]} */
    const designs = data.designs;

    const blockDesignData = new BlockDesignData(8, 4, data.designs.length);
    data.designs.forEach((design, i) => blockDesignData.setDesignAt(i, design.data));

    const canvas = html("canvas", { width: tilesTex.image.width, height: tilesTex.image.height });
    const ctx = canvas.getContext("2d");
    ctx.drawImage(tilesTex.image, 0, 0);
    const blob = await getCanvasBlob(canvas);
    const src = URL.createObjectURL(blob);

    const designSelectContainer = document.querySelector("#design-select");
    const tileToggleTemplate = designSelectContainer.querySelector("label");
    tileToggleTemplate.remove();

    data.designs.forEach((design) => {
        const x = -design.thumb % 16;
        const y = 512 + 32 * (1 + Math.floor(design.thumb / 16));

        const label = tileToggleTemplate.cloneNode(true);
        const input = label.querySelector("input");
        input.style = `background: url(${src}); background-position: ${x*16*2}px ${y}px; background-size: 512px`;
        input.title = design.name;
        designSelectContainer.append(label);
    });

    const blockDesignSelect = ui.radio("design-select");
    blockDesignSelect.selectedIndex = 0;

    const spriteSelectContainer = document.querySelector("#sprite-select");
    const spriteToggleTemplate = spriteSelectContainer.querySelector("label");
    spriteToggleTemplate.remove();

    const spriteTiles = (new Array(32)).fill(0).map((_, i) => i + 255 - 31);

    spriteTiles.forEach((tile) => {
        const x = -tile % 16;
        const y = 512 + 32 * (1 + Math.floor(tile / 16));

        const label = spriteToggleTemplate.cloneNode(true);
        const input = label.querySelector("input");
        input.style = `background: url(${src}); background-position: ${x*16*2}px ${y}px; background-size: 512px`;
        input.title = `tile ${tile}`;
        input.value = tile.toString();
        spriteSelectContainer.append(label);
    });

    const spriteSelect = ui.radio("sprite-select");
    spriteSelect.selectedIndex = 0;

    const spriteDialogue = ONE("textarea[name='sprite-dialogue']");
    spriteDialogue.addEventListener("input", () => {
        if (!selectedSprite) return;
        selectedSprite.dialogue = spriteDialogue.value;
    });

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

    const sprite2instance = new Map();
    const instance2sprite = new Map();

    data.blocks.forEach((block) => {
        const [x, y, z, r, s, d] = block;
        const shape = data.shapes.find((shape) => shape.id === s);
        blockMap.setBlockAt(new THREE.Vector3(x, y, z), shape.name, r, d);
    });
    
    const guyIndex = billboards.count++;
    billboards.setAxisAt(guyIndex, new THREE.Vector3(0, 1, 0), true);

    const promptIndex = billboards.count++;
    billboards.setAxisAt(promptIndex, new THREE.Vector3(0, 1, 0), true);

    data.characters.forEach((character, i) => {
        const { tile, position, id } = character;

        const index = billboards.count++;

        billboards.setPositionAt(index, new THREE.Vector3(...position));
        billboards.setAxisAt(index, new THREE.Vector3(0, 1, 0), true);
        billboards.setTileAt(index, tile, 0);

        sprite2instance.set(id, index);
        instance2sprite.set(index, id);
    });

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

    let selectedSprite = undefined;

    /**
     * @returns {BlocksDataProject}
     */
    function dumpLevel() {
        const vector = new THREE.Vector3();
        const shapes = Array.from(blockMap.meshes.keys()).map((name, i) => ({ name, id: i }));
        const designs_ = designs.map((design, i) => ({ ...design, id: i }));
        const blocks = [];
        shapes.forEach(({ name, id: s }) => {
            const mesh = blockMap.meshes.get(name);
            for (let i = 0; i < mesh.count; ++i) {
                mesh.getPositionAt(i, vector);
                const [x, y, z] = [vector.x, vector.y, vector.z];
                const r = mesh.getRotationAt(i);
                const d = mesh.getDesignAt(i);

                blocks.push([x, y, z, r, s, d]);
            }
        });

        return {
            designs: designs_,
            shapes,
            blocks,
            characters: data.characters,
            tileset: canvas.toDataURL(),
        }
    }

    async function makeExportHTML() {
        const bundle = dumpLevel();

        // make a copy of this web page
        const clone = /** @type {HTMLElement} */ (document.documentElement.cloneNode(true));
        // remove some unwanted elements from the page copy
        ALL("[data-empty]", clone).forEach((element) => element.replaceChildren());
        ALL("[data-editor-only]", clone).forEach((element) => element.remove());
        // insert the project bundle data into the page copy 
        ONE("#bundle-embed", clone).innerHTML = JSON.stringify(bundle);

        ONE("#player", clone).hidden = false;

        // default to player mode
        clone.setAttribute("data-app-mode", "player");

        return clone.outerHTML;
    }

    function updatePlayback() {
        if (modeSelect.value !== "game") {
            dialogue.hidden = true;
            billboards.setTileAt(promptIndex, 0);
            return;
        }

        const nearby = data.characters.find((char) => char.dialogue && guy.position.distanceTo(new THREE.Vector3(...char.position)) < 1.2);

        if (nearby && dialogue.hidden) {
            billboards.setPositionAt(promptIndex, 
                new THREE.Vector3(...nearby.position).add(new THREE.Vector3(0, 1, 0)));
            billboards.setTileAt(promptIndex, speakTile);
        } else {
            billboards.setTileAt(promptIndex, 0);
        }

        if (!dialogue.hidden && pressed["Enter"]) {
            dialogue.hidden = true;
        } else if (nearby && pressed["Enter"]) {
            dialogue.textContent = nearby.dialogue;
            dialogue.hidden = false;
        }
    }

    function updateBlocksEdit() {
        if (modeSelect.value !== "blocks") {
            hoveredBlock.mesh = undefined;
            selectionCube.visible = false;
            return;
        }

        const norm = getNormalisePointer();
        raycaster.setFromCamera(norm, camera);
        const [first] = raycaster.intersectObjects([blockMap, selectionCube], true);

        if (first && first.object === selectionCube) {
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(first.object.matrixWorld);
            hoveredBlock.normal.fromBufferAttribute(selectionCube.geometry.getAttribute("normal"), first.face.a);
            hoveredBlock.normal.applyNormalMatrix(normalMatrix);
        }

        if (first && !held["MouseRight"]) {
            if (first.object === selectionCube) {
                const orthoIndex = orthoNormals.findIndex((o) => o.distanceToSquared(hoveredBlock.normal) < 0.1);
                const quat = orthoOrients[orthoIndex];
                selectionCube.rotation.setFromQuaternion(quat);
            } else {
                const mesh = /** @type {BlockShapeInstances} */ (first.object);
                
                // const face = mesh.getFaceIndex(first.faceIndex);
                // mesh.getFaceTriangles(first.instanceId, face).forEach((triangle) => pushTriangle(pointsVerts, triangle));

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

        const hovered = hoveredBlock.mesh !== undefined;

        selectionCube.visible = hovered && modeSelect.value === "blocks";
        selectionCube.scale.set(1.01, 1.01, 1.01).multiplyScalar(hoveredBlock.mesh ? 1 : 0);

        if (hovered) {
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

            if (pressed["x"]) {
                const base = new THREE.Vector3();
                mesh.getPositionAt(instanceId, base);
                blockMap.delBlockAt(base);
                hoveredBlock.mesh = undefined;
            }
            
            const test2 = [
                [0, 2],
                [1, 4],
                [2, 0],
                [3, 5],
                [4, 1],
                [5, 3],
            ];

            if (first && first.object === selectionCube) {
                const orthoIndex = orthoNormals.findIndex((o) => o.distanceToSquared(hoveredBlock.normal) < 0.1);
                const [q, e] = test2[orthoIndex];

                if (pressed["q"]) {
                    const prev = mesh.getRotationAt(instanceId);
                    const next = S4Ops[q][prev];
                    mesh.setRotationAt(instanceId, next); 
                }

                if (pressed["e"]) {
                    const prev = mesh.getRotationAt(instanceId);
                    const next = S4Ops[e][prev];
                    mesh.setRotationAt(instanceId, next); 
                }
            }

            mesh.update();
        }
    }

    let placingSprite = undefined;

    function createSprite(position) {
        const id = Math.max(...data.characters.map((char) => char.id)) + 1;
        const instance = billboards.count++;
        sprite2instance.set(id, instance);
        instance2sprite.set(instance, id);

        billboards.setPositionAt(instance, position);
        billboards.setAxisAt(instance, new THREE.Vector3(0, 1, 0), true);
        billboards.setTileAt(instance, 255, 0);

        data.characters.push({id, dialogue: "", position: [...position], tile: 255 });
        
        selectSprite(id);
    }

    function moveSprite(position) {
        const instance = sprite2instance.get(selectedSprite.id);
        selectedSprite.position = [...position];
        billboards.setPositionAt(instance, position);
    }

    function selectSprite(id) {
        placingSprite = false;
        ONE("#selected-sprite").hidden = false;

        selectedSprite = data.characters.find((sprite) => sprite.id === id);
        spriteSelect.setValueSilent(selectedSprite.tile);
        spriteDialogue.value = selectedSprite.dialogue;
    }

    function deselectSprite() {
        ONE("#selected-sprite").hidden = true;
    }

    function deleteSprite() {
        data.characters.splice(data.characters.indexOf(selectedSprite), 1);

        const instance = sprite2instance.get(selectedSprite.id);
        sprite2instance.delete(selectedSprite.id);
        instance2sprite.delete(instance);

        if (instance !== billboards.count - 1) {
            const lastSprite = instance2sprite.get(billboards.count - 1);

            instance2sprite.set(instance, lastSprite);
            sprite2instance.set(lastSprite, instance);
            instance2sprite.delete(billboards.count - 1);

            const sprite = data.characters.find((sprite) => sprite.id === lastSprite);
            billboards.setPositionAt(instance, new THREE.Vector3(...sprite.position));
            billboards.setTileAt(instance, sprite.tile); 
        }
        billboards.count -= 1;

        deselectSprite();
    }

    function updateSpritesEdit() {
        if (modeSelect.value !== "sprites") {
            deselectSprite();
            placingSprite = undefined;
            return;
        }

        const norm = getNormalisePointer();
        raycaster.setFromCamera(norm, camera);

        if (placingSprite) {
            const [first] = raycaster.intersectObjects([blockMap], true);

            if (first) {
                const face = first.object.getFaceIndex(first.faceIndex);
                first.object.getFaceTriangles(first.instanceId, face).forEach((triangle) => pushTriangle(pointsVerts, triangle));

                const position = new THREE.Vector3();
                let count = 0;
                first.object.getFaceTriangles(first.instanceId, face).forEach((triangle) => {
                    position.add(triangle.a);
                    position.add(triangle.b);
                    position.add(triangle.c);
                    count += 3;
                });
                position.divideScalar(count);
                position.setY(position.y + .5);

                if (pressed["Mouse"]) {
                    placingSprite(position);
                    placingSprite = undefined;
                }
            }
        } else {
            const [first] = raycaster.intersectObjects([billboards], true);

            if (first) {
                billboards.getFaceTriangles(first.instanceId).forEach((triangle) => pushTriangle(pointsVerts, triangle));

                if (pressed["Mouse"]) {
                    selectSprite(instance2sprite.get(first.instanceId));
                }
            }
        }
    }

    spriteSelect.addEventListener("change", () => {
        if (!selectedSprite) return;

        selectedSprite.tile = spriteSelect.valueAsNumber;
        const instance = sprite2instance.get(selectedSprite.id);

        billboards.setTileAt(instance, selectedSprite.tile, 0);
        billboards.update();
    });

    function updatePhysics() {
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

        if (modeSelect.value === "game") {
            if (held["w"]) motion.add(forward.clone().multiplyScalar(3));
            if (held["s"]) motion.add(forward.clone().multiplyScalar(-3));
            if (held["a"]) motion.add(left.clone().multiplyScalar(-3));
            if (held["d"]) motion.add(left.clone().multiplyScalar(3));
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
        }

        guy.position.add(kinematic.nextPosition).y += (.5 - kinematic.capsule.radius);
        guy.position.multiplyScalar(.5);

        billboards.setPositionAt(guyIndex, guy.position);
        billboards.setTileAt(guyIndex, kinematic.hadGroundContact ? guyBackTile : guyFallTile);
    }

    function updateCamera() {
        const delta = guy.position.clone().sub(controls.target);
        controls.target.add(delta);
        camera.position.add(delta);
    }

    function animate() {
        if (blockMaterial.uniforms) blockMaterial.uniforms.frame.value = frame;
        if (timer == 0) frame = (frame + 1) % 4;
        timer = (timer + 1) % 20;

        billboards.update();
        renderer.render(scene, camera);

        updatePlayback();
        updateBlocksEdit();
        updateSpritesEdit();

        updatePhysics();
        updateCamera();

        controls.update();
        stats.update();

        pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointsVerts, 3));
        pointsVerts.length = 0;

        requestAnimationFrame(animate);
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

        const name = mouseButtons[event.button] ?? "Mouse";
        held[name] = true;
    });

    const mouseButtons = {
        0: "MouseLeft",
        2: "MouseRight",
    }

    window.addEventListener("pointerup", (event) => {
        pointer.set(event.clientX, event.clientY);
        held["Mouse"] = false;

        const name = mouseButtons[event.button] ?? "Mouse";
        held[name] = false;
    });

    renderer.domElement.addEventListener("mousedown", (event) => {
        const name = mouseButtons[event.button] ?? "Mouse";
        pressed[name] = true;
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

window.addEventListener("DOMContentLoaded", start);
