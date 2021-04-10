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

    addLoc(loc, nbor) {
        // if vertex is already in the map, access it and add neighbor to its neighbors
        if (this.nodes.has(loc)) {
            let nbors = this.nodes.get(loc).slice();
            let nborInNbors = false;
            nbors.forEach(function(itm) {
                nborInNbors = nborInNbors || (itm == nbor);
            });
            if (!nborInNbors) {
                nbors.push(nbor);
                this.nodes.set(loc, nbors);
            }
        } else {
            // else add vertex to map and create new array with neighbor
            this.nodes.set(loc, Array.from([nbor]));
        }
    }

    addVertex(vtx, nbor) {
        this.addLoc(vtx, nbor);
        this.addLoc(nbor, vtx);
    }

}

var graph = new Graph();
var tempMesh = new TriMesh();
var locations = new Array();

var reader = new FileReader();
var ctx = document.getElementById('bbmap').getContext('2d');
ctx.imageSmoothingEnabled = false;
ctx.fillStyle = 'red';

reader.onload = function(e) {
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
        locations.splice(idx, 1);
        ctx.clearRect(loc.x - 3, loc.y, 4, 4);
    }
}

function addLocToMesh(loc) {
    tempMesh.vertices.push(loc);
    ctx.fillStyle = 'lime';
    ctx.fillRect(loc.x - 3, loc.y, 4, 4);
    ctx.fillStyle = 'red';
}

function constructTriMesh(e) {
    let idx = selectLocation(getOffsetLoc(e));
    if (idx != -1) {
        var loc = locations[idx];
        addLocToMesh(loc);
        if (tempMesh.vertices.length == 1) {
            ctx.beginPath();
            ctx.moveTo(loc.x, loc.y);
        } else if (tempMesh.vertices.length == 2) {
            // add new vertex to mesh, connect vertex in mesh to new vertex as neighbor
            graph.addVertex(tempMesh.vertices[0], loc);
            ctx.lineTo(loc.x, loc.y);
        } else if (tempMesh.vertices.length == 3) {
            // add new vertex to mesh, connect vertices in mesh to new vertex, save mesh in map, create new temp mesh
            graph.addVertex(tempMesh.vertices[0], loc);
            graph.addVertex(tempMesh.vertices[1], loc);
            graph.meshes.push(tempMesh);
            tempMesh = new TriMesh();
            ctx.lineTo(loc.x, loc.y);
            ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
            ctx.fill();
        }
    }
}

function calc_area(v1, v2, v3)
{
    let det = 0;
    det = (
        (v1.x - v3.x) *
        (v2.y - v3.y)) - (
        (v2.x - v3.x) *
        (v1.y - v3.y));
    return Math.abs(det / 2);
}

function contains_point(mesh, loc)
{
    var vertices = mesh.vertices;
    var total = calc_area(vertices[0], vertices[1], vertices[2]);
    var area1 = calc_area(loc, vertices[1], vertices[2]);
    var area2 = calc_area(loc, vertices[0], vertices[2]);
    var area3 = calc_area(loc, vertices[0], vertices[1]);

    if ((area1 + area2 + area3) > total)
        return false;
    else
        return true;
}

function destroyTriMesh(e) {
    let loc = getOffsetLoc(e);
    // see if click is inside triangle
    // if it is, delete that mesh
    graph.meshes.forEach(function(itm, idx) {
        if (contains_point(itm, loc)) {
            graph.meshes.splice(idx, 1);
            return;
        }
    });
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

function setDestroyTriangle(e) {
    selectButton(e.target);
    document.getElementById('bbmap').onclick = destroyTriMesh;
}
