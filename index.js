var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Rand = /** @class */ (function () {
    function Rand() {
    }
    Rand.getRandomInt = function (start, end) {
        if (start === void 0) { start = 0; }
        if (end === void 0) { end = 100; }
        return Math.round(Math.random() * (end - start) + start);
    };
    Rand.getRandomColor = function (start, end) {
        if (start === void 0) { start = 60; }
        if (end === void 0) { end = 255; }
        return "rgb(" + this.getRandomInt(start, end) + "," + this.getRandomInt(start, end) + "," + this.getRandomInt(start, end) + ")";
    };
    return Rand;
}());
var Point = /** @class */ (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.prototype.add = function (p) {
        return new Point(this.x + p.x, this.y + p.y);
    };
    Point.prototype.multiply = function (n) {
        return new Point(this.x * n, this.y * n);
    };
    Point.prototype.scalar = function (p) {
        return new Point(this.x * p.x, this.y * p.y);
    };
    Point.prototype.length = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    Point.prototype.round = function (n) {
        return new Point(+this.x.toFixed(n), +this.y.toFixed(n));
    };
    Point.prototype.contains = function (p) {
        return p.x <= this.x && p.y <= this.y;
    };
    Point.getDistance = function (x, y) {
        return Math.sqrt(Math.pow(x.x - y.x, 2) + Math.pow(x.y - y.y, 2));
    };
    return Point;
}());
var WorldObject = /** @class */ (function () {
    function WorldObject(size, position, speed) {
        this.size = size;
        this.position = position;
        this.speed = speed;
        this.init();
    }
    WorldObject.prototype.init = function () {
    };
    WorldObject.prototype.render = function (ctx) {
    };
    WorldObject.prototype.tick = function (world) {
        this.speed = this.speed.round(2);
        if (world.size.contains(this.position.add(this.size)))
            this.speed = this.speed.add(world.gravity);
        this.position = this.position.add(this.speed);
        if ((this.position.x >= world.size.x - this.size.x && this.speed.x >= 0) || this.position.x <= 0 && this.speed.x <= 0)
            this.speed.x *= -1 * this.elasticity;
        if ((this.position.y >= world.size.y - this.size.y && this.speed.y >= 0) || this.position.y <= 0 && this.speed.y <= 0)
            this.speed.y *= -1 * this.elasticity;
    };
    WorldObject.prototype.remove = function () {
        this.removed = true;
    };
    WorldObject.prototype.contains = function (p) {
        return false;
    };
    return WorldObject;
}());
var Ball = /** @class */ (function (_super) {
    __extends(Ball, _super);
    function Ball() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Ball.prototype.init = function () {
        this.color = Rand.getRandomColor();
        this.elasticity = 0.8;
    };
    Ball.prototype.render = function (ctx) {
        ctx.beginPath();
        ctx.arc(this.position.x + this.size.x / 2, this.position.y + this.size.y / 2, this.size.x / 2, 2 * Math.PI, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    };
    Ball.prototype.contains = function (p) {
        var center = this.position.add(this.size.multiply(0.5));
        return center.add(p.multiply(-1)).length() <= this.size.x / 2;
    };
    Ball.createRandom = function (worldSize, radius, speed) {
        if (radius === void 0) { radius = Rand.getRandomInt(20, 120); }
        if (speed === void 0) { speed = Math.random() * 10 - 5; }
        var size = new Point(radius * 2, radius * 2);
        var position = worldSize.add(size.multiply(-1)).scalar(new Point(Math.random(), Math.random()));
        return new Ball(size, position, new Point(speed * Math.random(), speed * Math.random()));
    };
    return Ball;
}(WorldObject));
var World = /** @class */ (function () {
    function World(element) {
        this.element = element;
        this.objectsToAdd = [];
        this.objects = [];
        this.gravity = new Point(0, 0.5);
        this.init();
    }
    World.prototype.init = function () {
        this.resize();
        this.tick();
    };
    World.prototype.resize = function () {
        this.size = new Point(window.innerWidth, window.innerHeight);
        this.element.width = this.size.x;
        this.element.height = this.size.y;
        this.ctx = this.element.getContext("2d");
    };
    World.prototype.addObject = function (object) {
        this.objectsToAdd.push(object);
    };
    World.prototype.tick = function () {
        var _this = this;
        this.clear();
        this.objects = this.objects.concat(this.objectsToAdd);
        this.objectsToAdd = [];
        this.objects = this.objects.filter(function (object) {
            object.tick(_this);
            if (!object.removed)
                object.render(_this.ctx);
            return !object.removed;
        });
        requestAnimationFrame(function () { return _this.tick(); });
    };
    World.prototype.clear = function () {
        this.ctx.clearRect(0, 0, this.size.x, this.size.y);
    };
    return World;
}());
var world = new World(document.getElementById("canvas"));
for (var i = 0; i < 10; i++) {
    world.addObject(Ball.createRandom(world.size));
}
window.addEventListener("resize", function () {
    world.resize();
});
window.addEventListener("devicemotion", function (event) {
    world.gravity = new Point(event.accelerationIncludingGravity.x, -event.accelerationIncludingGravity.y);
    world.gravity.multiply(1 / 30);
});
