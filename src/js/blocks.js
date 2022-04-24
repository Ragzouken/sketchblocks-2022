const orthoNormals = [
    new THREE.Vector3( 0,  1,  0),
    new THREE.Vector3( 0,  0,  1),
    new THREE.Vector3( 0, -1,  0),
    new THREE.Vector3( 1,  0,  0),
    new THREE.Vector3( 0,  0, -1),
    new THREE.Vector3(-1,  0,  0),
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
            name: "back",
            positions: [[1, 0, 0], [0, 0, 0], [0, .5, 0], [1, .5, 0]],
            texturing: [   [0, 1],    [1, 1],    [1, .5],    [0, .5]],
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
            name: "front",
            positions: [[0, .5, 1], [0, 0, 1], [1, 0, 1], [1, .5, 1]],
            texturing: [   [1, .5],    [1, 1],    [0, 1],    [0, .5]],
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

        {
            name: "bottom",
            positions: [[0, 0, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1]],
            texturing: [   [1, 0],    [1, 1],    [0, 1],    [0, 0]],
            triangles: [[0, 1, 2], [0, 2, 3]]
        },
    ],
}
