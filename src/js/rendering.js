const orthoNormals = [
    new THREE.Vector3(0, 0,  1),
    new THREE.Vector3(0, 0, -1),

    new THREE.Vector3(0,  1, 0),
    new THREE.Vector3(0, -1, 0),

    new THREE.Vector3( 1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
];

const S4Lookup = [];

for (const up of orthoNormals) {
    for (const forward of orthoNormals) {
        if (Math.abs(up.dot(forward)) > .1) continue;
        const left = up.clone().cross(forward);
        S4Lookup.push(new THREE.Matrix4().makeBasis(left, up, forward));
    }
}

// dihedral group 2 i.e rotation+flip of rect
const D2Lookup = [
    0, 1,    3, 0,    2, 3,     1, 2, 
    2, 1,    1, 0,    0, 3,     3, 2,
];

const tileDefines = `
uniform float tileScale;
uniform int[16] D2Lookup;

vec2 mapFace(vec2 uv, int orientation) {
    vec4 components = vec4(uv.x, uv.y, 1.0 - uv.x, 1.0 - uv.y);
    int xi = D2Lookup[orientation * 2 + 0];
    int yi = D2Lookup[orientation * 2 + 1];
    return vec2(components[xi], components[yi]);
}

vec2 mapTile(vec2 uv, float tile) {
    uv += vec2(mod(tile, 16.0), floor(tile / 16.0));
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
`;

const blockTileUVs = `
    #ifdef USE_UV
        float faceIndex = uvSpecial.z;
        vec4 faceTiles = faceIndex <= 3.0 ? faceTiles0 : faceTiles1;
        vec4 faceRots = faceIndex <= 3.0 ? faceOrients0 : faceOrients1;

        int index = int(mod(faceIndex, 4.0));
        float tileIndex = faceTiles[index];
        int rotIndex = int(faceRots[index]);

        vUv = mapFace(uvSpecial.xy, rotIndex);
        vUv = mapTile(vUv, tileIndex);
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
    shader.vertexShader = shader.vertexShader.replace("#include <uv_vertex>", blockTileUVs);
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

//     shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `
// varying vec3 vColor;
// #include <common>
//         `.trim(),
//     );

//     shader.fragmentShader = shader.fragmentShader.replace("#include <output_fragment>", `
// #include <output_fragment>
// gl_FragColor *= vec4(vColor, 1.0);
//         `.trim(),
//     );
};

const _matrix = new THREE.Matrix4();
const _vector = new THREE.Vector4();

class BlockShapeInstances {
    /**
     * @param {THREE.BufferGeometry} geometry
     * @param {THREE.Material} material
     * @param {number} count
     */
    constructor(geometry, material, count) {
        this.orientation = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4);
        this.orientation.setUsage(THREE.DynamicDrawUsage);

        this.faceTiles0 = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4).setUsage(THREE.DynamicDrawUsage);
        this.faceTiles1 = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4).setUsage(THREE.DynamicDrawUsage);
        this.faceOrients0 = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4).setUsage(THREE.DynamicDrawUsage);
        this.faceOrients1 = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4).setUsage(THREE.DynamicDrawUsage);

        this.mesh = new THREE.InstancedMesh(geometry.clone(), material, count);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        this.mesh.geometry.setAttribute("instanceOrientation", this.orientation);
        this.mesh.geometry.setAttribute("faceTiles0", this.faceTiles0);
        this.mesh.geometry.setAttribute("faceTiles1", this.faceTiles1);
        this.mesh.geometry.setAttribute("faceOrients0", this.faceOrients0);
        this.mesh.geometry.setAttribute("faceOrients1", this.faceOrients1);
    }

    set count(value) { this.mesh.count = value; }
    get count() { return this.mesh.count; }

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
        //this.mesh.instanceMatrix.needsUpdate = true;
        this.orientation.needsUpdate = true;
        this.faceOrients0.needsUpdate = true;
        this.faceOrients1.needsUpdate = true;
        this.faceTiles0.needsUpdate = true;
        this.faceTiles1.needsUpdate = true;
    }
}
