const orthoNormals = [
    new THREE.Vector3(0, 0,  1),
    new THREE.Vector3(0, 0, -1),

    new THREE.Vector3(0,  1, 0),
    new THREE.Vector3(0, -1, 0),

    new THREE.Vector3( 1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
];

const cubeOrientations = [];

for (const up of orthoNormals) {
    for (const forward of orthoNormals) {
        if (Math.abs(up.dot(forward)) > .1) continue;
        const left = up.clone().cross(forward);
        cubeOrientations.push(new THREE.Matrix4().makeBasis(left, up, forward));
    }
}

function blockShapeShaderFixer(shader) {
    shader.uniforms.tileScale = { value: 1/16 };
    shader.uniforms.rotations = { value: cubeOrientations };

    shader.vertexShader = shader.vertexShader.replace("#include <common>", `
#include <common>
uniform float tileScale;
uniform mat4[24] rotations;
attribute vec4 instanceOrientation;
attribute vec3 uvSpecial;
        `.trim(),
    );

    shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>", `
vec4 mvPosition = vec4(transformed, 1.0);
mat4 blockMatrix = rotations[int(instanceOrientation.w)];
blockMatrix[3].xyz = instanceOrientation.xyz;
mvPosition = blockMatrix * mvPosition;
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;
        `.trim(),
    );

    shader.vertexShader = shader.vertexShader.replace("#include <uv_vertex>", `
#ifdef USE_UV
    float faceIndex = uvSpecial.z;
    vec4 faceTiles = faceIndex <= 3.0 ? instanceMatrix[0] : instanceMatrix[1];
    float tileIndex = faceTiles[int(mod(faceIndex, 4.0))];
    vec2 tile = vec2(mod(tileIndex, 16.0), floor(tileIndex / 16.0));
    vUv = (uvTransform * vec3(uvSpecial.xy, 1)).xy;
    vUv += tile;
    vUv *= tileScale;
#endif
        `.trim(),
    );
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
        this.attributes = {
            tile0: new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4).setUsage(THREE.DynamicDrawUsage),
            tile1: new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4).setUsage(THREE.DynamicDrawUsage),
        };

        this.orientation = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4);
        this.orientation.setUsage(THREE.DynamicDrawUsage);

        this.mesh = new THREE.InstancedMesh(geometry.clone(), material, count);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        this.mesh.geometry.setAttribute("instanceOrientation", this.orientation);
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
    setTilesAt(index, tile) {
        this.mesh.getMatrixAt(index, _matrix);
        _matrix.set(
            tile, tile, tile, tile,
            tile, tile, tile, tile,
            0,    0,    0,    0,
            0,    0,    0,    0,
        );
        this.mesh.setMatrixAt(index, _matrix);

        this.attributes.tile0.setXYZW(index, tile, tile, tile, tile);
        this.attributes.tile1.setXYZW(index, tile, tile, tile, tile);
    }

    /**
     * @param {number} index
     * @param {number} face
     * @param {number} tile 
     * @param {number} rotation
     */
    setTileAt(index, face, tile, rotation=0) {
        this.mesh.getMatrixAt(index, _matrix);
        _matrix.elements[face] = tile;
        _matrix.elements[face+8] = rotation;
        this.mesh.setMatrixAt(index, _matrix);
    }

    update() {
        this.mesh.instanceMatrix.needsUpdate = true;
        this.orientation.needsUpdate = true;
    }
}
