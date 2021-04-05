class Location {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class TriMesh {
    vertices = new Array();
    midpoints = new Array();
}

class Graph {
    nodes = new Map();
    meshes = new Array();
    addVertex(vtx, nbor) {
        // if vertex is already in the map, access it and add neighbor to its neighbors
        if (this.nodes.has(vtx)) {
            let nbors = this.nodes.get(vtx).slice();
            let nborInNbors = false;
            nbors.forEach(function(itm) {
                nborInNbors = nborInNbors || (itm == nbor);
            });
            if (!nborInNbors) {
                nbors.push(nbor);
                this.nodes.set(vtx, nbors);
            }
        } else {
            // else add vertex to map and create new array with neighbor
            this.nodes.set(vtx, Array.from([nbor]));
        }
    }
}

var graph = new Graph();
var tempMesh = new TriMesh();
var locations = new Array();

var reader = new FileReader();

reader.onload = function(e) {
    let ctx = document.getElementById('bbmap').getContext('2d');
    ctx.imageSmoothingEnabled = false;
    let img = new Image();
    img.src = e.target.result;
    img.onload = function() {
        ctx.drawImage(img, 0, 0, 640, 400);
    };
};

function getOffsetLoc(e) { return new Location(e.offsetX - 1, e.offsetY - 3); }

function addLocation(e) {
    let loc = getOffsetLoc(e);
    locations.push(loc);

    let ctx = document.getElementById('bbmap').getContext('2d');
    ctx.fillRect(loc.x - 3, loc.y, 4, 4);
}

function selectLocation(loc) {
    let sel = -1;
    locations.forEach(function(itm, idx) {
        if ((loc.x <= itm.x + 2 && loc.x >= itm.x - 2) && (loc.y >= itm.y - 2 && loc.y <= itm.y + 2)) {
            sel = idx; return;
        }
    });
    return sel;
}

function removeLocation(e) {
    let idx = selectLocation(getOffsetLoc(e));
    if (idx != -1) {
        let loc = locations[idx];
        let ctx = document.getElementById('bbmap').getContext('2d');
        locations.splice(idx, 1);
        ctx.clearRect(loc.x - 3, loc.y, 4, 4);
    }
}

function addLocToMesh(loc) {
    tempMesh.vertices.push(loc);
    let ctx = document.getElementById('bbmap').getContext('2d');
    ctx.fillStyle = `rgb(85,85,170)`;
    ctx.fillRect(loc.x - 3, loc.y, 4, 4);
    ctx.fillStyle = 'black';
}

function constructTriMesh(e) {
    let idx = selectLocation(getOffsetLoc(e));
    if (idx != -1) {
        var loc = locations[idx];
        addLocToMesh(loc);
        if (tempMesh.vertices.length == 2) {
            // add new vertex to mesh, connect vertex in mesh to new vertex as neighbor
            graph.addVertex(tempMesh.vertices[0], loc);
        } else if (tempMesh.vertices.length == 3) {
            // add new vertex to mesh, connect vertices in mesh to new vertex, save mesh in map, create new temp mesh
            tempMesh.vertices.forEach(function(itm) {
                graph.addVertex(itm, loc);
            });
            graph.meshes.push(tempMesh);
            tempMesh = new TriMesh();
        }
    }
}

function readImage(input) {
    if (input.files && input.files[0]) {
        reader.readAsDataURL(input.files[0]);
    }
}

function setImage() { readImage(document.querySelector('input[type="file"]')); }

function selectButton(btn) {
    if (document.getElementById('selected-btn'))
        document.getElementById('selected-btn').id = null;
    btn.id = 'selected-btn';
}

function setAddVertex(e) {
    selectButton(e.target);
    document.getElementById('bbmap').onclick = addLocation;
}

function setRemoveVertex(e) {
    selectButton(e.target);
    document.getElementById('bbmap').onclick = removeLocation;
}

function setCreateTriangle(e) {
    selectButton(e.target);
    document.getElementById('bbmap').onclick = constructTriMesh;
}
