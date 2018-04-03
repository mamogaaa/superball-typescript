class Color {
  constructor(public r:number, public g:number, public b:number, public a:number = 1) {

  }

  public setAlpha(a):Color {
    return new Color(this.r, this.g, this.b, a);
  }

  public toString():string {
    return `rgba(${this.r},${this.g},${this.b},${this.a})`;
  }
}

class Rand {
  static getRandomInt(start:number = 0, end:number = 100):number {
    return Math.round(Math.random()*(end - start) + start);
  }

  static getRandomColor(start:number = 60, end:number = 255):Color {
    return new Color(this.getRandomInt(start, end), this.getRandomInt(start, end), this.getRandomInt(start, end))
  }
}

class Point {
  constructor(public x:number, public y:number) {

  }

  public add(p:Point):Point {
    return new Point(this.x + p.x, this.y + p.y);
  }

  public multiply(n:number):Point {
    return new Point(this.x * n, this.y * n);
  }

  public scalar(p:Point):Point {
    return new Point(this.x * p.x, this.y * p.y);
  }

  public length():number {
    return Math.sqrt(this.x*this.x + this.y*this.y);
  }

  public round(n:number):Point {
    return new Point(+this.x.toFixed(n), +this.y.toFixed(n));
  }

  public contains(p:Point):boolean {
    return p.x <= this.x && p.y <= this.y;
  }
 
  static getDistance(x:Point, y:Point):number {
    return Math.sqrt( Math.pow(x.x-y.x, 2) + Math.pow(x.y-y.y, 2) );
  }
}

class WorldObject {
  public removed:boolean;
  public elasticity:number;
  public hover:boolean = false;
  public drag:boolean = false;
  protected dragPoint:Point = new Point(0, 0);

  constructor(public size:Point, public position:Point, public speed:Point) {
    this.init();
  }

  protected init():void {

  }
 
  public render(ctx:any):void {

  }

  public tick(world:World):void {
    this.speed = this.speed.round(2);
    if (world.size.contains(this.position.add(this.size)))
      this.speed = this.speed.add(world.gravity);
    this.position = this.position.add(this.speed);

    if ((this.position.x >= world.size.x - this.size.x && this.speed.x >= 0) || this.position.x <= 0 && this.speed.x <= 0)
      this.speed.x *= -1 * this.elasticity;
    if ((this.position.y >= world.size.y - this.size.y && this.speed.y >= 0) || this.position.y <= 0 && this.speed.y <= 0)
      this.speed.y *= -1 * this.elasticity;
  }

  public remove():void {
    this.removed = true;
  }

  public dragStart(p:Point):void {
    if (this.drag) return;
    this.drag = true;
    this.dragPoint = p.add(this.position.multiply(-1));
  }

  public dragMove(p:Point):void {
    if (!this.drag) return;
    this.position = p.add(this.dragPoint.multiply(-1));
  }

  public dragEnd(p:Point):void {
    if (!this.drag) return;
    this.drag = false;
    this.speed = new Point(0, 0);
  }

  public contains(p:any):boolean {
    if (Array.isArray(p))
      return this.containsPoints(p);
    return this.containsPoint(p);
  }

  protected containsPoint(p:Point):boolean {
    return false;
  }

  protected containsPoints(points:Array<Point>):boolean {
    for (let p of points)
      if (this.containsPoint(p)) return true;
    return false;
  }
}

class Ball extends WorldObject {
  public color:Color = Rand.getRandomColor();
  protected init():void {
    this.elasticity = 0.8;
  }

  public render(ctx:any):void {
    ctx.beginPath();
    ctx.arc(this.position.x + this.size.x/2, this.position.y + this.size.y/2, this.size.x/2, 2 * Math.PI, false);
    ctx.fillStyle = this.getColor().toString();
    ctx.fill();
  }

  protected containsPoint(p:Point):boolean {
    let center = this.position.add(this.size.multiply(0.5));
    return center.add(p.multiply(-1)).length() <= this.size.x/2
  }

  private getColor():Color {
    if (this.drag)
      return this.color.setAlpha(0.6);
    if (this.hover)
      return this.color.setAlpha(0.8);
    return this.color;
  }

  static createRandom(worldSize:Point, radius:number = Rand.getRandomInt(20, 120), speed = Math.random()*10 - 5):Ball {
    let size = new Point(radius*2, radius*2);
    let position = worldSize.add(size.multiply(-1)).scalar(new Point(Math.random(), Math.random()));
    return new Ball(size, position, new Point(speed*Math.random(), speed*Math.random()));
  }
}

class Pointer {
  public position:Point;
  public pressed = false;
  public id:string;

  constructor(x:number = 0, y:number = 0, pressed:boolean = false) {
    this.position = new Point(x, y);
    this.pressed = pressed;
  }

  public update(x:number, y:number, pressed:any = undefined) {
    this.position = new Point(x, y);
    if (pressed !== undefined)
      this.pressed = pressed;
  }

}

class World {
  constructor (private element:any) {
    this.objectsToAdd = [];
    this.objects = [];
    this.gravity = new Point(0, 0.5);
    this.init();
  }

  public size:Point;
  public gravity:Point;
  public pointer:Pointer = new Pointer();
  public objects:Array<WorldObject>;
  public ctx:any;

  public init():void {
    this.resize();
    this.tick();
  }

  public resize():void {
    this.size = new Point(window.innerWidth, window.innerHeight);
    this.element.width = this.size.x;
    this.element.height = this.size.y;
    this.ctx = this.element.getContext("2d");
  }

  public addObject(object:WorldObject):void {
    this.objectsToAdd.push(object);
  }

  private tick():void {
    this.clear();
    this.objects = this.objects.concat(this.objectsToAdd);
    this.objectsToAdd = [];
    let hoverObject = null;
    let dragObject = null;
    for (let object of this.objects) {
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
      } else
        dragObject.hover = true;
    }

    if (this.pointer.pressed && hoverObject && !dragObject)
      hoverObject.dragStart(this.pointer.position);

    this.objects = this.objects.filter((object:WorldObject):boolean => {
      if (!object.drag)
        object.tick(this);
      return !object.removed;
    });
      
    for (let object of this.objects)
      object.render(this.ctx);

    requestAnimationFrame(() => this.tick());
  }

  private clear():void {
    this.ctx.clearRect(0, 0, this.size.x, this.size.y);
  }

  private objectsToAdd:Array<WorldObject>;
}

const world = new World(document.getElementById("canvas"));
for (let i = 0; i < 10; i++) {
  world.addObject(Ball.createRandom(world.size));
}
window.addEventListener("resize", () => {
  world.resize();
});

window.addEventListener("pointermove", (event) => {
  world.pointer.update(event.pageX, event.pageY);
  event.preventDefault();
});

window.addEventListener("pointerdown", (event) => {
  world.pointer.update(event.pageX, event.pageY, true);
  event.preventDefault();
});

window.addEventListener("pointerup", (event) => {
  world.pointer.update(event.pageX, event.pageY, false);
  event.preventDefault();
});

window.addEventListener("devicemotion", function (event) {
  world.gravity = new Point(event.accelerationIncludingGravity.x, -event.accelerationIncludingGravity.y);
  world.gravity.multiply(1/30);
});

