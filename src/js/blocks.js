const orthoNormals = [
    new THREE.Vector3( 0,  1,  0),
    new THREE.Vector3( 0,  0,  1),
    new THREE.Vector3( 0, -1,  0),
    new THREE.Vector3( 1,  0,  0),
    new THREE.Vector3( 0,  0, -1),
    new THREE.Vector3(-1,  0,  0),
];

const orthoOrients = [];
orthoOrients.length = 6;

/** @type {THREE.Matrix3[]} */
const S4Lookup = [];

/** @type {THREE.Quaternion[]} */
const S4Quats = [];

orthoNormals.forEach((up, i) => {
    orthoNormals.forEach((forward) => {
        if (Math.abs(up.dot(forward)) > .1) return;
        const left = up.clone().cross(forward);
        const matrix = new THREE.Matrix4().makeBasis(left, up, forward);
        S4Lookup.push(new THREE.Matrix3().setFromMatrix4(matrix));

        const q = new THREE.Quaternion().setFromRotationMatrix(matrix).normalize();
        S4Quats.push(q);
        orthoOrients[i] = q;
    });
});

/**
 * @param {THREE.Quaternion} quaternion
 */
function quaternionToS4(quaternion) {
    return S4Quats.findIndex((o) => Math.abs(o.dot(quaternion)) >= 0.99);
}

const S4Ops = [];

orthoNormals.forEach((axis) => {
    const rotation = new THREE.Quaternion().setFromAxisAngle(axis, Math.PI/2).normalize();
    const rotationLookup = [];
    S4Ops.push(rotationLookup);

    S4Quats.forEach((prevOrientation) => {
        const nextOrientation = rotation.clone().multiply(prevOrientation).normalize();
        const nextOrientationIndex = quaternionToS4(nextOrientation);
        rotationLookup.push(nextOrientationIndex);
    });
});

// dihedral group 4 i.e rotation+flip of rect
const D4Lookup = [
    0, 1,    3, 0,    2, 3,     1, 2, 
    2, 1,    1, 0,    0, 3,     3, 2,
];

const cube = {
    name: "cube",

    faces: [
        {
            name: "top",
            positions: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]],
            texturing: [   [1, 1],    [0, 1],    [0, 0],    [1, 0]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "bottom",
            positions: [[0, 0, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1]],
            texturing: [   [0, 1],    [0, 0],    [1, 0],    [1, 1]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "front",
            positions: [[0, 1, 1], [0, 0, 1], [1, 0, 1], [1, 1, 1]],
            texturing: [   [0, 1],    [0, 0],    [1, 0],    [1, 1]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "back",
            positions: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]],
            texturing: [   [0, 0],    [1, 0],    [1, 1],    [0, 1]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "left",
            positions: [[1, 1, 1], [1, 0, 1], [1, 0, 0], [1, 1, 0]],
            texturing: [   [0, 1],    [0, 0],    [1, 0],    [1, 1]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "right",
            positions: [[0, 1, 0], [0, 0, 0], [0, 0, 1], [0, 1, 1]],
            texturing: [   [0, 1],    [0, 0],    [1, 0],    [1, 1]],
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
            texturing: [   [0, 1],    [0, 0],    [1, 0],    [1, 1]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "bottom",
            positions: [[0, 0, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1]],
            texturing: [   [0, 1],    [0, 0],    [1, 0],    [1, 1]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "back",
            positions: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]],
            texturing: [   [0, 0],    [1, 0],    [1, 1],    [0, 1]],
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
            name: "top",
            positions: [[0, .5, 1], [1, .5, 1], [1, .5, 0], [0, .5, 0]],
            texturing: [   [1, 1],    [0, 1],    [0, 0],    [1, 0]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "bottom",
            positions: [[0, 0, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1]],
            texturing: [   [0, 1],    [0, 0],    [1, 0],    [1, 1]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "front",
            positions: [[0, .5, 1], [0, 0, 1], [1, 0, 1], [1, .5, 1]],
            texturing: [   [0, .5],    [0, 0],    [1, 0],    [1, .5]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "back",
            positions: [[1, 0, 0], [0, 0, 0], [0, .5, 0], [1, .5, 0]],
            texturing: [   [0, 0],    [1, 0],    [1, .5],    [0, .5]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "left",
            positions: [[1, .5, 1], [1, 0, 1], [1, 0, 0], [1, .5, 0]],
            texturing: [   [0, .5],    [0, 0],    [1, 0],    [1, .5]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "right",
            positions: [[0, .5, 0], [0, 0, 0], [0, 0, 1], [0, .5, 1]],
            texturing: [   [0, .5],    [0, 0],    [1, 0],    [1, .5]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },
    ],
}

const wedgeHead =
{
    name: "wedge-head",

    faces:
    [
        {
            name: "slope",
            positions: [[0, .5, 0], [0, 0, 1], [1, 0, 1], [1, .5, 0]],
            texturing: [   [0, 1],    [0, 0],    [1, 0],    [1, 1]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "bottom",
            positions: [[0, 0, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1]],
            texturing: [   [1, 0],    [1, 1],    [0, 1],    [0, 0]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "back",
            positions: [[1, 0, 0], [0, 0, 0], [0, .5, 0], [1, .5, 0]],
            texturing: [   [0, 0],    [1, 0],    [1, .5],    [0, .5]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "left",
            positions: [[1, .5, 0], [1, 0, 1], [1, 0, 0]],
            texturing: [   [1, .5],    [0, 0],    [1, 0]],
            triangles: [[0, 1, 2]]
        },

        {
            name: "right",
            positions: [[0, 0, 1], [0, .5, 0], [0, 0, 0]],
            texturing: [   [1, 0],    [0, .5],    [0, 0]],
            triangles: [[0, 1, 2]]
        },
    ],
}

const wedgeBody =
{
    name: "wedge-body",

    faces: [
        {
            name: "slope",
            positions: [[0, .5, 1], [1, .5, 1], [1, 1, 0], [0, 1, 0]],
            texturing: [    [0, 0],     [1, 0],    [1, 1],    [0, 1]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "bottom",
            positions: [[0, 0, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1]],
            texturing: [   [1, 0],    [1, 1],    [0, 1],    [0, 0]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "front",
            positions: [[0, .5, 1], [0, 0, 1], [1, 0, 1], [1, .5, 1]],
            texturing: [   [0, .5],    [0, 0],    [1, 0],    [1, .5]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "back",
            positions: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]],
            texturing: [   [0, 0],    [1, 0],    [1, 1],    [0, 1]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "left",
            positions: [[1, .5, 1], [1, 0, 1], [1, 0, 0], [1, 1, 0]],
            texturing: [   [0, .5],    [0, 0],    [1, 0],    [1, 1]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },

        {
            name: "right",
            positions: [[0, 1, 0], [0, 0, 0], [0, 0, 1], [0, .5, 1]],
            texturing: [   [0, 1],    [0, 0],    [1, 0],    [1, .5]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },
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
