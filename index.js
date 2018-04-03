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
var Color = /** @class */ (function () {
    function Color(r, g, b, a) {
        if (a === void 0) { a = 1; }
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    Color.prototype.setAlpha = function (a) {
        return new Color(this.r, this.g, this.b, a);
    };
    Color.prototype.toString = function () {
        return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
    };
    return Color;
}());
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
        return new Color(this.getRandomInt(start, end), this.getRandomInt(start, end), this.getRandomInt(start, end));
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
        this.hover = false;
        this.drag = false;
        this.dragPoint = new Point(0, 0);
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
    WorldObject.prototype.dragStart = function (p) {
        if (this.drag)
            return;
        this.drag = true;
        this.dragPoint = p.add(this.position.multiply(-1));
    };
    WorldObject.prototype.dragMove = function (p) {
        if (!this.drag)
            return;
        this.position = p.add(this.dragPoint.multiply(-1));
    };
    WorldObject.prototype.dragEnd = function (p) {
        if (!this.drag)
            return;
        this.drag = false;
        this.speed = new Point(0, 0);
    };
    WorldObject.prototype.contains = function (p) {
        if (Array.isArray(p))
            return this.containsPoints(p);
        return this.containsPoint(p);
    };
    WorldObject.prototype.containsPoint = function (p) {
        return false;
    };
    WorldObject.prototype.containsPoints = function (points) {
        for (var _i = 0, points_1 = points; _i < points_1.length; _i++) {
            var p = points_1[_i];
            if (this.containsPoint(p))
                return true;
        }
        return false;
    };
    return WorldObject;
}());
var Ball = /** @class */ (function (_super) {
    __extends(Ball, _super);
    function Ball() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.color = Rand.getRandomColor();
        return _this;
    }
    Ball.prototype.init = function () {
        this.elasticity = 0.8;
    };
    Ball.prototype.render = function (ctx) {
        ctx.beginPath();
        ctx.arc(this.position.x + this.size.x / 2, this.position.y + this.size.y / 2, this.size.x / 2, 2 * Math.PI, false);
        ctx.fillStyle = this.getColor().toString();
        ctx.fill();
    };
    Ball.prototype.containsPoint = function (p) {
        var center = this.position.add(this.size.multiply(0.5));
        return center.add(p.multiply(-1)).length() <= this.size.x / 2;
    };
    Ball.prototype.getColor = function () {
        if (this.drag)
            return this.color.setAlpha(0.6);
        if (this.hover)
            return this.color.setAlpha(0.8);
        return this.color;
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
var Pointer = /** @class */ (function () {
    function Pointer(x, y, pressed) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (pressed === void 0) { pressed = false; }
        this.pressed = false;
        this.position = new Point(x, y);
        this.pressed = pressed;
    }
    Pointer.prototype.update = function (x, y, pressed) {
        if (pressed === void 0) { pressed = undefined; }
        this.position = new Point(x, y);
        if (pressed !== undefined)
            this.pressed = pressed;
    };
    return Pointer;
}());
var World = /** @class */ (function () {
    function World(element) {
        this.element = element;
        this.pointer = new Pointer();
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
        var hoverObject = null;
        var dragObject = null;
        for (var _i = 0, _a = this.objects; _i < _a.length; _i++) {
            var object = _a[_i];
            object.hover = false;
            if (object.contains(this.pointer.position))
                hoverObject = object;
            if (object.drag)
                dragObject = object;
        }
        if (hoverObject)
            hoverObject.hover = true;
        if (dragObject) {
            dragObject.dragMove(this.pointer.position);
            if (!this.pointer.pressed) {
                dragObject.dragEnd(this.pointer.position);
                dragObject.hover = false;
            }
            else
                dragObject.hover = true;
        }
        if (this.pointer.pressed && hoverObject && !dragObject)
            hoverObject.dragStart(this.pointer.position);
        this.objects = this.objects.filter(function (object) {
            if (!object.drag)
                object.tick(_this);
            return !object.removed;
        });
        for (var _b = 0, _c = this.objects; _b < _c.length; _b++) {
            var object = _c[_b];
            object.render(this.ctx);
        }
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
window.addEventListener("mousemove", function (event) {
    world.pointer.update(event.pageX, event.pageY);
    event.preventDefault();
});
window.addEventListener("mousedown", function (event) {
    world.pointer.update(event.pageX, event.pageY, true);
    event.preventDefault();
});
window.addEventListener("mouseup", function (event) {
    world.pointer.update(event.pageX, event.pageY, false);
    event.preventDefault();
});
window.addEventListener("touchmove", function (event) {
    world.pointer.update(event.changedTouches[0].pageX, event.changedTouches[0].pageY);
    event.preventDefault();
});
window.addEventListener("touchstart", function (event) {
    world.pointer.update(event.changedTouches[0].pageX, event.changedTouches[0].pageY, true);
    event.preventDefault();
});
window.addEventListener("touchend", function (event) {
    world.pointer.update(event.changedTouches[0].pageX, event.changedTouches[0].pageY, false);
    event.preventDefault();
});
window.addEventListener("devicemotion", function (event) {
    world.gravity = new Point(event.accelerationIncludingGravity.x, -event.accelerationIncludingGravity.y);
    world.gravity.multiply(1 / 30);
});
