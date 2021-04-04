class Location {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

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

function removeLocation(e) {
    let loc = getOffsetLoc(e);
    locations.forEach(function(itm, idx, arr) {
        if (loc.x == itm.x && loc.y == itm.y) {
            let ctx = document.getElementById('bbmap').getContext('2d');
            locations.splice(idx, 1);
            ctx.clearRect(loc.x - 3, loc.y, 4, 4);
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
