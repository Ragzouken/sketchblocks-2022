const tileDefines = `
uniform float tileScale;
uniform int[16] D2Lookup;

vec2 mapTile(vec2 uv, int tile, int orientation) {
    vec4 components = vec4(uv.x, uv.y, 1.0 - uv.x, 1.0 - uv.y);
    int xi = D2Lookup[orientation * 2 + 0];
    int yi = D2Lookup[orientation * 2 + 1];
    uv = vec2(components[xi], components[yi]);
    
    float t = float(tile);
    uv += vec2(mod(t, 16.0), floor(t / 16.0));
    uv *= tileScale;

    return uv;
}
`;

const cubeDefines = `
uniform mat4[24] S4Lookup;

mat4 mapCube(vec3 position, int orientation) {
    mat4 matrix = S4Lookup[orientation];
    matrix[3].xyz = position;
    return matrix;
}
`;

const blockTileDefines = tileDefines + cubeDefines + `
attribute vec4 instanceOrientation;
attribute vec3 uvSpecial;

attribute vec4 faceTiles0;
attribute vec4 faceTiles1;
attribute vec4 faceOrients0;
attribute vec4 faceOrients1;

vec2 getTileData() {
    float faceIndex = uvSpecial.z;
    vec4 faceTiles = faceIndex <= 3.0 ? faceTiles0 : faceTiles1;
    vec4 faceRots = faceIndex <= 3.0 ? faceOrients0 : faceOrients1;

    int index = int(mod(faceIndex, 4.0));
    float tileIndex = faceTiles[index];
    float rotIndex = faceRots[index];

    return vec2(tileIndex, rotIndex);
}
`;

const quadTileDefines = tileDefines + `
attribute vec3 instancePosition;
attribute vec4 instanceAxis;
attribute vec2 instanceTile;

vec2 getTileData() {
    return instanceTile;
}
`;

const tileUVs = `
    #ifdef USE_UV
        vec2 tile = getTileData();
        vUv = mapTile(uvSpecial.xy, int(tile.x), int(tile.y));
    #endif
`;

/** 
 * @param {THREE.Shader} shader
 */
function blockShapeShaderFixer(shader) {
    shader.uniforms.tileScale = { value: 1/16 };
    shader.uniforms.S4Lookup = { value: S4Lookup };
    shader.uniforms.D2Lookup = { value: D2Lookup };

    shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
` + blockTileDefines);
    shader.vertexShader = shader.vertexShader.replace("#include <uv_vertex>", tileUVs);
    shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>", `
vec4 mvPosition = vec4(transformed, 1.0);
mat4 blockMatrix = mapCube(instanceOrientation.xyz, int(instanceOrientation.w));
mat4 combined = projectionMatrix * modelViewMatrix * blockMatrix; 

// pull backfaces in a little to prevent z-fighting inside transparent blocks
vec3 norm = transformDirection(normal, combined);
float offset = dot(norm, vec3(0.0, 0.0, 1.0));
mvPosition.xyz -= normal * clamp(offset, 0.0, 1.0) * 0.001;

gl_Position = combined * mvPosition;
        `.trim(),
    );
};

/** 
 * @param {THREE.Shader} shader
 */
 function billboardShaderFixer(shader) {
    shader.uniforms.tileScale = { value: 1/16 };
    shader.uniforms.D2Lookup = { value: D2Lookup };

    shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
` + quadTileDefines);
    shader.vertexShader = shader.vertexShader.replace("#include <uv_vertex>", `
    #ifdef USE_UV
        vec2 tile = getTileData();
        vUv = mapTile(uv, int(tile.x), int(tile.y));
    #endif
`);
    shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>", `
vec4 mvPosition = vec4(transformed, 1.0);

vec3 forward = -inverse(modelViewMatrix)[2].xyz;
vec3 up      = instanceAxis.xyz;
vec3 left    = normalize(cross(forward, up));
up           = mix(normalize(cross(left, forward)), up, instanceAxis.w);
forward      = cross(left, up);

mat4 quadMatrix = mat4(1.0);
quadMatrix[0].xyz = left;
quadMatrix[1].xyz = up;
quadMatrix[2].xyz = forward;
quadMatrix[3].xyz = instancePosition;

gl_Position = projectionMatrix * modelViewMatrix * quadMatrix * mvPosition;
        `.trim(),
    );
};

class BlockShapeInstances extends THREE.InstancedMesh {
    /**
     * @param {THREE.BufferGeometry} geometry
     * @param {THREE.Material} material
     * @param {number} count
     */
    constructor(geometry, material, count) {
        super(geometry.clone(), material, count);
        this.count = 0;

        this.orientation = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4);
        this.orientation.setUsage(THREE.DynamicDrawUsage);

        this.faceTiles0 = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4).setUsage(THREE.DynamicDrawUsage);
        this.faceTiles1 = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4).setUsage(THREE.DynamicDrawUsage);
        this.faceOrients0 = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4).setUsage(THREE.DynamicDrawUsage);
        this.faceOrients1 = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4).setUsage(THREE.DynamicDrawUsage);

        this.geometry.setAttribute("instanceOrientation", this.orientation);
        this.geometry.setAttribute("faceTiles0", this.faceTiles0);
        this.geometry.setAttribute("faceTiles1", this.faceTiles1);
        this.geometry.setAttribute("faceOrients0", this.faceOrients0);
        this.geometry.setAttribute("faceOrients1", this.faceOrients1);
    }

    static _box = new THREE.Box3();
    static _matrix = new THREE.Matrix4();
    static _orientation = new THREE.Vector4();
    
    /**
     * @param {number} index
     * @param {THREE.Matrix4} target
     */
    getMatrixAt(index, target) {
        const _orientation = BlockShapeInstances._orientation;

        _orientation.fromBufferAttribute(this.orientation, index);
        target.copy(S4Lookup[_orientation.w]);
        target.setPosition(_orientation.x, _orientation.y, _orientation.z);

        return target;
    }

    /**
     * @param {number} index
     * @param {THREE.Vector3} target
     */
    getPositionAt(index, target) {
        target.fromBufferAttribute(this.orientation, index);
    }

    /**
     * @param {number} index
     * @param {THREE.Vector3} position
     */
    setPositionAt(index, position) {
        this.orientation.setXYZ(index, position.x, position.y, position.z);
    }

    /**
     * @param {number} index
     * @param {number} rotation
     */
     setRotationAt(index, rotation) {
        this.orientation.setW(index, rotation);
    }

    /**
     * @param {number} index
     * @param {number} tile
     */
    setTilesAt(index, tile, rot=0) {
        // this.mesh.getMatrixAt(index, _matrix);
        // _matrix.set(
        //     tile, tile, tile, tile,
        //     tile, tile, tile, tile,
        //     rot,  rot,  rot,  rot,
        //     rot,  rot,  rot,  rot,
        // );
        // this.mesh.setMatrixAt(index, _matrix);
        this.faceTiles0.setXYZW(index, tile, tile, tile, tile);
        this.faceTiles1.setXYZW(index, tile, tile, tile, tile);
        this.faceOrients0.setXYZW(index, rot, rot, rot, rot);
        this.faceOrients1.setXYZW(index, rot, rot, rot, rot);
    }

    /**
     * @param {number} index
     * @param {number} face
     * @param {number} tile 
     * @param {number} rotation
     */
    setTileAt(index, face, tile, rotation=0) {
        // this.mesh.getMatrixAt(index, _matrix);
        // _matrix.elements[face] = tile;
        // _matrix.elements[face+8] = rotation;
        // this.mesh.setMatrixAt(index, _matrix);

        if (face === 0) this.faceTiles0.setX(index, tile);
        if (face === 1) this.faceTiles0.setY(index, tile);
        if (face === 2) this.faceTiles0.setZ(index, tile);
        if (face === 3) this.faceTiles0.setW(index, tile);
        if (face === 4) this.faceTiles1.setX(index, tile);
        if (face === 5) this.faceTiles1.setY(index, tile);
        if (face === 6) this.faceTiles1.setZ(index, tile);
        if (face === 7) this.faceTiles1.setW(index, tile);

        if (face === 0) this.faceOrients0.setX(index, rotation);
        if (face === 1) this.faceOrients0.setY(index, rotation);
        if (face === 2) this.faceOrients0.setZ(index, rotation);
        if (face === 3) this.faceOrients0.setW(index, rotation);
        if (face === 4) this.faceOrients1.setX(index, rotation);
        if (face === 5) this.faceOrients1.setY(index, rotation);
        if (face === 6) this.faceOrients1.setZ(index, rotation);
        if (face === 7) this.faceOrients1.setW(index, rotation);
    }

    update() {
        this.orientation.needsUpdate = true;
        this.faceOrients0.needsUpdate = true;
        this.faceOrients1.needsUpdate = true;
        this.faceTiles0.needsUpdate = true;
        this.faceTiles1.needsUpdate = true;
    }

    /**
     * @returns {PhysicsTriangle[]}
     */
    getTriangles() {
        const _matrix = BlockShapeInstances._matrix;

        const positions = this.geometry.getAttribute('position');
        const indexes = this.geometry.index.array;

        const triangles = [];
        for (let i = 0; i < this.count; ++i) {
            this.getMatrixAt(i, _matrix);

            for (let i = 0; i < indexes.length; i += 3) {
                const [i0, i1, i2] = [indexes[i+0], indexes[i+1], indexes[i+2]];
                const v0 = new THREE.Vector3().fromBufferAttribute(positions, i0);
                const v1 = new THREE.Vector3().fromBufferAttribute(positions, i1);
                const v2 = new THREE.Vector3().fromBufferAttribute(positions, i2);
    
                v0.applyMatrix4(_matrix);
                v1.applyMatrix4(_matrix);
                v2.applyMatrix4(_matrix);
    
                triangles.push(new PhysicsTriangle(v0, v1, v2));
            }
        }

        return triangles;
    }

    /**
     * @param {THREE.Box3} bounds
     */
    getTrianglesInBounds(bounds, target) {
        const _matrix = BlockShapeInstances._matrix;
        const cube = BlockShapeInstances._box;

        const offset = new THREE.Vector3(.5, .5, .5);

        const positions = this.geometry.getAttribute('position');
        const indexes = this.geometry.index.array;

        for (let i = 0; i < this.count; ++i) {
            this.getPositionAt(i, cube.min);
            cube.max.copy(cube.min);

            cube.min.sub(offset);
            cube.max.add(offset);

            if (!bounds.intersectsBox(cube)) continue;

            this.getMatrixAt(i, _matrix);

            for (let i = 0; i < indexes.length; i += 3) {
                // const [i0, i1, i2] = [indexes[i+0], indexes[i+1], indexes[i+2]];

                // triangle.setFromAttributeAndIndices(positions, i0, i1, i2);
                // triangle.a.applyMatrix4(_matrix);
                // triangle.b.applyMatrix4(_matrix);
                // triangle.c.applyMatrix4(_matrix);
                // target.push(new PhysicsTriangle(triangle.a, triangle.b, triangle.c));

                const [i0, i1, i2] = [indexes[i+0], indexes[i+1], indexes[i+2]];
                const v0 = new THREE.Vector3().fromBufferAttribute(positions, i0);
                const v1 = new THREE.Vector3().fromBufferAttribute(positions, i1);
                const v2 = new THREE.Vector3().fromBufferAttribute(positions, i2);
    
                v0.applyMatrix4(_matrix);
                v1.applyMatrix4(_matrix);
                v2.applyMatrix4(_matrix);
    
                target.push(new PhysicsTriangle(v0, v1, v2));
            }
        }
    }
}

class BillboardInstances extends THREE.InstancedMesh {
    /**
     * @param {THREE.BufferGeometry} geometry
     * @param {THREE.Material} material
     * @param {number} count
     */
    constructor(geometry, material, count) {
        material = material.clone();
        material.onBeforeCompile = billboardShaderFixer;

        super(geometry.clone(), material, count);
        this.count = 0;

        this.positions = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
        this.positions.setUsage(THREE.DynamicDrawUsage);

        this.axis = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4);
        this.axis.setUsage(THREE.DynamicDrawUsage);
        
        this.tile = new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2);
        this.tile.setUsage(THREE.DynamicDrawUsage);

        this.geometry.setAttribute("instancePosition", this.positions);
        this.geometry.setAttribute("instanceAxis", this.axis);
        this.geometry.setAttribute("instanceTile", this.tile);
    }

    /**
     * @param {number} index
     * @param {THREE.Vector3} position
     */
    setPositionAt(index, position) {
        this.positions.setXYZ(index, position.x, position.y, position.z);
    }

    /**
     * @param {number} index
     * @param {THREE.Vector3} axis
     * @param {boolean} pinned
     */
    setAxisAt(index, axis, pinned=false) {
        this.axis.setXYZW(index, axis.x, axis.y, axis.z, pinned ? 1 : 0);
    }

    /**
     * @param {number} index
     * @param {number} tile 
     * @param {number} rotation
     */
    setTileAt(index, tile, rotation=0) {
        this.tile.setXY(index, tile, rotation);
    }

    update() {
        this.positions.needsUpdate = true;
        this.axis.needsUpdate = true;
        this.tile.needsUpdate = true;
    }
}
