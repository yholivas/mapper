const loc = {x: 0, y: 0};
var locations = [loc];

var action;
var reader = new FileReader();

reader.onload = function(e) {
    let ctx = document.getElementById('bbmap').getContext('2d');
    ctx.mozImageSmoothingEnabled = false;
    let img = new Image();
    img.src = e.target.result;
    img.onload = function() {
        ctx.drawImage(img, 0, 0, 640, 400);
    };
};

function addLocation(x, y) {
    let loc = {x: x, y: y};
    locations.push(loc);
    let printedList = "";
    locations.forEach(
        function(item, index, array) {
            printedList += item.x.toString() + item.y.toString()
        }
    );
    document.getElementById("locations").textContent = printedList;
}

function readImage(input) {
    if (input.files && input.files[0]) {
        reader.readAsDataURL(input.files[0]);
    }
}

function setImage() {
    readImage(document.querySelector('input[type="file"]'));
}
