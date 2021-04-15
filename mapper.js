class Location {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    toString() {
        return '{' + this.x.toString() + ', ' + this.y.toString() + '}';
    }
}

class TriMesh {
    vertices = new Array();
    midpoints = new Array();

    toString() {
        let str = new String();
        if (this.vertices[0]) str += '{{' + this.vertices[0].toString();
        this.vertices.forEach(function(itm, idx) {
            if (idx > 0) str += ', ' + itm.toString();
        });
        str += '}, {';
        // midpoints go here:
        str += '}}\n';
        return str;
    }
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

    removeNeighbor(loc, nbor) {
        if (this.nodes.has(loc)) {
            let idx = this.nodes.get(loc).indexOf(nbor);
            if (idx != -1) {
                let nbors = this.nodes.get(loc).slice();
                nbors.splice(idx, 1);
                if (nbors.length == 0) {
                    this.nodes.delete(loc);
                } else {
                    this.nodes.set(loc, nbors);
                }
            }
        }
    }

    removeMeshNeighbors(mesh) {
        this.removeNeighbor(mesh.vertices[0], mesh.vertices[1]);
        this.removeNeighbor(mesh.vertices[0], mesh.vertices[2]);
        this.removeNeighbor(mesh.vertices[1], mesh.vertices[0]);
        this.removeNeighbor(mesh.vertices[1], mesh.vertices[2]);
        this.removeNeighbor(mesh.vertices[2], mesh.vertices[0]);
        this.removeNeighbor(mesh.vertices[2], mesh.vertices[1]);
    }
}

var graph = new Graph();
var tempMesh = new TriMesh();
var locations = new Array();

var reader = new FileReader();
var ctx = document.getElementById('bbmap').getContext('2d');
ctx.imageSmoothingEnabled = false;

var canvasFunc;

var img = new Image();
reader.onload = function(e) {
    img.src = e.target.result;
    img.onload = function() {
        ctx.drawImage(img, 0, 0, 640, 400);
    };
};

function getOffsetLoc(e) { return new Location(e.offsetX - 1, e.offsetY - 3); }

function addLocation(e) {
    let loc = getOffsetLoc(e);
    locations.push(loc);
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
    }
}

function checkTempMesh(loc) {
    let alreadyPresent = false;
    if (tempMesh.vertices[0]) {
        let loc1 = tempMesh.vertices[0];
        alreadyPresent = alreadyPresent || (loc.x == loc1.x && loc.y == loc1.y);
    }
    if (tempMesh.vertices[1]) {
        let loc2 = tempMesh.vertices[1];
        alreadyPresent = alreadyPresent || (loc.x == loc2.x && loc.y == loc2.y);
    }
    return alreadyPresent;
}

function constructTriMesh(e) {
    let idx = selectLocation(getOffsetLoc(e));
    if (idx != -1) {
        var loc = locations[idx];
        if (checkTempMesh(loc)) return;
        tempMesh.vertices.push(loc);
        if (tempMesh.vertices.length == 2) {
            // add new vertex to mesh, connect vertex in mesh to new vertex as neighbor
            graph.addVertex(tempMesh.vertices[0], loc);
        } else if (tempMesh.vertices.length == 3) {
            // add new vertex to mesh, connect vertices in mesh to new vertex, save mesh in map, create new temp mesh
            graph.addVertex(tempMesh.vertices[0], loc);
            graph.addVertex(tempMesh.vertices[1], loc);
            graph.meshes.push(tempMesh);
            tempMesh = new TriMesh();
        }
    }
}

function calc_area(v1, v2, v3) {
    let det = 0;
    det = (
        (v1.x - v3.x) *
        (v2.y - v3.y)) - (
        (v2.x - v3.x) *
        (v1.y - v3.y));
    return Math.abs(det / 2);
}

function contains_point(mesh, loc) {
    var vertices = mesh.vertices;
    var total = calc_area(vertices[0], vertices[1], vertices[2]);
    var area1 = calc_area(loc, vertices[1], vertices[2]);
    var area2 = calc_area(loc, vertices[0], vertices[2]);
    var area3 = calc_area(loc, vertices[0], vertices[1]);

    return (area1 + area2 + area3) <= total
}

function destroyTriMesh(e) {
    let loc = getOffsetLoc(e);
    // see if click is inside triangle
    // if it is, delete that mesh
    // TODO: have to destroy mesh from graph node map
    graph.meshes.forEach(function(itm, idx) {
        if (contains_point(itm, loc)) {
            graph.removeMeshNeighbors(itm);
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

function drawDots(arr) {
    arr.forEach(function(itm) {
        ctx.fillRect(itm.x - 3, itm.y, 4, 4);
    });
}

function updateCanvas(e) {
    canvasFunc(e);
    // clear everything
    ctx.clearRect(0, 0, 640, 400);
    // draw image
    if (img) ctx.drawImage(img, 0, 0, 640, 400);
    // draw locations array
    ctx.fillStyle = 'red';
    drawDots(locations);
    // draw meshes
    ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
    graph.meshes.forEach(function(itm) {
        // first vertex
        ctx.beginPath();
        ctx.moveTo(itm.vertices[0].x, itm.vertices[0].y);
        // second vertex
        ctx.lineTo(itm.vertices[1].x, itm.vertices[1].y);
        // third vertex
        ctx.lineTo(itm.vertices[2].x, itm.vertices[2].y);
        ctx.fill();
    });
    // probably draw any locations in tempmesh as green
    ctx.fillStyle = 'lime';
    drawDots(tempMesh.vertices);
}

function selectButton(btn) {
    if (document.getElementById('selected-btn'))
        document.getElementById('selected-btn').id = null;
    btn.id = 'selected-btn';
}

function setAddVertex(e) {
    selectButton(e.target);
    canvasFunc = addLocation;
}

function setRemoveVertex(e) {
    selectButton(e.target);
    canvasFunc = removeLocation;
}

function setCreateTriangle(e) {
    selectButton(e.target);
    canvasFunc = constructTriMesh;
}

function setDestroyTriangle(e) {
    selectButton(e.target);
    canvasFunc = destroyTriMesh;
}

// exporting graph data:
// straightforward approach for now - only export Graph struct, save it all as literals
// don't really need references to individual locations
// later: figure out logic for how midpoints will be generated
function exportData() {
    var dataString = new String();
    dataString += '#include "graph.h"\n\n';
    dataString += 'Graph myGraph {{\n';
    // location unordered map
    graph.nodes.forEach(function(nbors, node) {
        dataString += '{' + node.toString() + ', {';
        if(nbors[0]) dataString += nbors[0].toString();
        nbors.forEach(function(itm, idx) {
            if (idx > 0) dataString += ', ' + itm.toString();
        });
        dataString += '}},\n';
    });
    dataString += '}, {\n';
    // graph mesh array
    if (graph.meshes[0]) dataString += graph.meshes[0].toString();
    graph.meshes.forEach(function(itm, idx) {
        if (idx > 0) dataString += ', ' + itm.toString();
    });
    dataString += '}};'
    window.open(URL.createObjectURL(new Blob([dataString], {type : 'text/plain'})));
}
