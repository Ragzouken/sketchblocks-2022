class BlockShape
{
    indices;
    positions;
    texcoords;
    normals;

    // mapping of face id to list of distinct indices used
    faces = new Map();

    // mapping of triangle number to face id
    tri2face = [];

    // shareable position attributes
    positionBuffer;
    normalBuffer; 

    get vertexCount()
    {
        return this.positions.length / 3;
    } 

    constructor(data)
    {
        this.name = data.name;

        const indices;

        data.faces.forEach((face, faceIndex) =>
        {
            // offset indices relative to existing vertices
            const indexOffset = this.vertexCount;
            const faceIndexes = face.triangles.reduce((a, b) => [...a, ...b], [])
                                              .map(index => index + indexOffset);

            this.indices.push(...faceIndexes);
            this.faces.set(face.name, faceIndexes);

            face.triangles.forEach(_ => this.tri2face.push(face.name));

            // compute shared normal and add all positions/texcoords/normals
            const positions = face.positions.slice(0, 3).map(position => new THREE.Vector3(...position));
            
            const normal = new THREE.Vector3();
            normal.crossVectors(positions[1].clone().sub(positions[0]),
                                positions[2].clone().sub(positions[0])); 

            for (let i in face.positions)
            {
                this.positions.push(...face.positions[i]);
                this.texcoords.push(...face.texturing[i]);
                this.normals.push(normal.x, normal.y, normal.z);
            }
        });

        // threejs stuff
        this.positionBuffer = new Float32BufferAttribute(this.positions, 3);
        this.normalBuffer   = new Float32BufferAttribute(this.normals,   3);

        return this;
    }

    public toData(): BlockShapeData
    {
        const faces: BlockShapeFaceData[] = [];

        this.faces.forEach((indexes, name) =>
        {
            const min = Math.min(...indexes);
            const max = Math.max(...indexes);
            const count = max - min + 1;
            indexes = indexes.map(index => index - min);

            const face: BlockShapeFaceData =
            {
                name: name,
                positions: [],
                texturing: [],
                triangles: [],
            }

            for (let i = 0; i < count; ++i)
            {
                const j = i + min;
                face.positions.push(this.positions.slice(j * 3, j * 3 + 3) as Vector3Data);
                face.texturing.push(this.texcoords.slice(j * 2, j * 2 + 2) as Vector2Data);
            }

            for (let i = 0; i < indexes.length; i += 3)
            {
                face.triangles.push(indexes.slice(i, i + 3) as Vector3Data);
            }

            faces.push(face);
        });

        const data = {
            name: this.name,
            uuid: this.uuid,
            faces: faces,
        }

        return data;
    }
}