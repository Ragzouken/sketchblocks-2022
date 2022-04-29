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
