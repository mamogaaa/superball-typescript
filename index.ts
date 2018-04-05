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

  static getRandomString(length:number = 10):string {
    let text:string = "";
    let possible:string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
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

  public multiplyEach(p:Point):Point {
    return new Point(this.x * p.x, this.y * p.y);
  }

  public scalar(p:Point):number {
    return this.x * p.x + this.y * p.y;
  }

  public projection(p:Point):number {
    return this.scalar(p)/p.length();
  }

  public length():number {
    return Math.sqrt(this.x*this.x + this.y*this.y);
  }

  public round(n:number):Point {
    return new Point(+this.x.toFixed(n), +this.y.toFixed(n));
  }

  public contains(p:Point):boolean {
    return p.x <= this.x && p.y <= this.y && p.x >= 0 && p.y >= 0;
  }
 
  static getDistance(x:Point, y:Point):number {
    return Math.sqrt( Math.pow(x.x-y.x, 2) + Math.pow(x.y-y.y, 2) );
  }
}

class WorldObject {
  public world:World;
  public removed:boolean;
  public elasticity:number;
  public hover:boolean = false;
  public collision:boolean = false;
  public drag:boolean = false;
  public priority:number = 10;
  public density:number = 1;
  public id:string;
  protected dragPoint:Point = new Point(0, 0);

  constructor(public size:Point, public position:Point, public speed:Point = new Point(0, 0)) {
    this.id = Rand.getRandomString(10);
  }

  public init(world:World):void {

  }
 
  public render(ctx:any):void {

  }

  public tick(world:World):void {
    this.processCollisions(world);
    this.speed = this.speed.round(1);
    this.position = this.position.round(1);

    if (this.position.x >= world.size.x - this.size.x && this.speed.x > 0)
      this.speed.x = -Math.abs(this.speed.x)*this.elasticity;
    if (this.position.y >= world.size.y - this.size.y && this.speed.y > 0)
      this.speed.y = -Math.abs(this.speed.y)*this.elasticity;
    if (this.position.x <= 0 && this.speed.x < 0)
      this.speed.x = Math.abs(this.speed.x)*this.elasticity;
    if (this.position.y <= 0 && this.speed.y < 0)
      this.speed.y = Math.abs(this.speed.y)*this.elasticity;


    if (world.size.contains(this.position.add(this.size)))
      this.speed = this.speed.add(world.gravity);
    this.position = this.position.add(this.speed);

    this.resetCross();
    
  }

  public resetCross():void {
    let crossX = this.position.x - world.size.x - this.size.x;
    if (crossX > 0) this.position.x -= crossX;
    if (this.position.x < 0) this.position.x = 0;
    let crossY = this.position.y - world.size.y - this.size.y;
    if (crossY > 0) this.position.y -= crossY;
    if (this.position.y < 0) this.position.y = 0;
  }

  protected processCollisions(world:World):void {
  }

  public remove():void {
    this.removed = true;
  }

  public dragStart(p:Point, pointer:Pointer):void {
    if (this.drag) return;
    this.drag = true;
    this.dragPoint = p.add(this.position.multiply(-1));
  }

  public dragMove(p:Point, pointer:Pointer):void {
    if (!this.drag) return;
    this.position = p.add(this.dragPoint.multiply(-1));
  }

  public dragEnd(p:Point, pointer:Pointer):void {
    if (!this.drag) return;
    this.drag = false;
    this.speed = pointer.speed.multiply(1/this.world.getFPS());
  }

  public contains(p:any):boolean {
    if (Array.isArray(p))
      return this.containsPoints(p);
    return this.containsPoint(p);
  }

  public getCenterPoint():Point {
    return this.position.add(this.size.multiply(1/2));
  }

  public getWeight():number {
    return this.density*this.size.x*this.size.y;
  }

  protected containsPoint(p:Point):boolean {
    return this.size.contains(p.add(this.position.multiply(-1)));
  }

  protected containsPoints(points:Array<Point>):boolean {
    for (let p of points)
      if (this.containsPoint(p)) return true;
    return false;
  }
}

class Ball extends WorldObject {
  public color:Color = Rand.getRandomColor();
  public init(world:World):void {
    this.elasticity = 0.95;
  }

  public render(ctx:any):void {
    ctx.beginPath();
    ctx.arc(this.position.x + this.size.x/2, this.position.y + this.size.y/2, this.size.x/2, 2 * Math.PI, false);
    ctx.fillStyle = this.getColor().toString();
    ctx.fill();
  }

  public getRadius():number {
    return this.size.x/2;
  }

  public getWeight():number {
    return this.density*this.getRadius()*this.getRadius()*Math.PI;
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
    if (this.collision)
      return new Color(255, 0, 0, 0.5);
    return this.color;
  }

  protected processCollisions(world:World):void {
    for (let object of world.objects) {
      if (object.id == this.id) continue;
      if (object.drag) continue;
      if (object instanceof Ball) {

        if (this.getCenterPoint().add(object.getCenterPoint().multiply(-1)).length() <= this.getRadius()+object.getRadius()) {
          let m1 = this.getWeight(),
              m2 = object.getWeight();
          let v1 = this.speed.projection(this.getCenterPoint().add(object.getCenterPoint().multiply(-1))),
              v2 = object.speed.projection(this.getCenterPoint().add(object.getCenterPoint().multiply(-1)));
          let newV1 = (2*m2*v2+(m1-m2)*v1)/(m1+m2);
          let newV2 = (2*m1*v1+(m2-m1)*v2)/(m1+m2);
          let norm = this.getCenterPoint().add(object.getCenterPoint().multiply(-1));
          norm = norm.multiply(1/norm.length());
          let cross = norm.multiply(Math.abs(this.getRadius()+object.getRadius() - this.getCenterPoint().add(object.getCenterPoint().multiply(-1)).length()));
          this.speed = this.speed.add(norm.multiply(-v1+newV1)).multiply(this.elasticity);
          object.speed = object.speed.add(norm.multiply(-v2+newV2)).multiply(this.elasticity);
          this.position = this.position.add(cross.multiply(1/2));
          object.position = object.position.add(cross.multiply(-1/2));
          this.resetCross();
          object.resetCross();
        }
      }
    }
  }

  static createRandom(worldSize:Point, radius:number = Rand.getRandomInt(5, 20), speed = Math.random()*40 - 20):Ball {
    let size = new Point(radius*2, radius*2);
    let position = worldSize.add(size.multiply(-1)).multiplyEach(new Point(Math.random(), Math.random()));
    return new Ball(size, position, new Point(speed*Math.random(), speed*Math.random()));
  }
}

class Pointer {
  public position:Point;
  public speed:number = 0;
  public timestamp:number = Date.now();
  public pressed:boolean = false;
  public id:string;

  constructor(x:number = 0, y:number = 0, pressed:boolean = false) {
    this.position = new Point(x, y);
    this.pressed = pressed;
    this.timestamp = Date.now();
  }

  public update(x:number, y:number, pressed:any = undefined, event:any = undefined) {

    let newPosition = new Point(x, y);
    let newTimestamp = Date.now();
    if (event.type.indexOf('env') < 0)
      this.speed = newPosition.add(this.position.multiply(-1)).multiply(1/(newTimestamp - this.timestamp)*1000);
    this.speed.x = Math.min(this.speed.x, 1);
    this.speed.y = Math.min(this.speed.y, 1);
    this.timestamp = newTimestamp;
    this.position = newPosition;
    if (pressed !== undefined)
      this.pressed = pressed;
  }

}

class GravitySlider extends WorldObject {
  public priority:number = -1;
  public init(world:World) {
    this.position = new Point(20, 20);
  }

  public tick(world:World):void {
    // let center = this.position.add(this.size.multiply(1/2));
  }

  public dragMove(p:Point, pointer:Pointer):void {
    if (!this.drag) return;
    this.dragPoint = p.add(this.position.multiply(-1));
    if (this.dragPoint.x >= this.size.x)
      this.dragPoint.x = this.size.x;
    if (this.dragPoint.y >= this.size.y)
      this.dragPoint.y = this.size.y;
    if (this.dragPoint.y <= 0)
      this.dragPoint.y = 0;
    if (this.dragPoint.x <= 0)
      this.dragPoint.x = 0;
    this.world.gravity = this.dragPoint.add(this.size.multiply(-1/2)).multiply(1/50);
  }

  public render(ctx:any):void {
    let handlePosition = this.position;
    if (handlePosition.x >= this.size.x)
      handlePosition.x = this.size.x;
    if (handlePosition.y >= this.size.y)
      handlePosition.y = this.size.y;
    if (handlePosition.y <= 0)
      handlePosition.y = 0;
    if (handlePosition.x <= 0)
      handlePosition.x = 0;
    handlePosition = handlePosition.add(this.size.multiply(1/2)).add(this.world.gravity.multiply(50));
    ctx.fillStyle = ctx.strokeStyle = this.hover ? "blue": "red";
    ctx.strokeRect(this.position.x, this.position.y, this.size.x, this.size.y);
    ctx.beginPath();
    ctx.arc(handlePosition.x, handlePosition.y, 10, 2 * Math.PI, false);
    ctx.fill();
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.world.gravity.x.toFixed(2)}, ${this.world.gravity.y.toFixed(2)}`, this.position.x, this.position.add(this.size).y+15);
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`${world.getFPS()} FPS`, this.position.add(this.size).x, this.position.add(this.size).y+15);
  }
}

class World {
  constructor (private element:any) {
    this.objectsToAdd = [];
    this.objects = [];
    this.gravity = new Point(0, 0);
    this.init();
  }

  public size:Point;
  public gravity:Point;
  public pointer:Pointer = new Pointer();
  public objects:Array<WorldObject>;
  public ctx:any;
  public motionSensor:boolean = true;
  private ticks:number = 0;
  private ticksInterval:number = 1000;
  private fps:number = 0;

  public init():void {
    this.resize();
    this.tick();
    setInterval(() => {
      this.fps = this.ticks;
      this.ticks = 0;
    }, this.ticksInterval)
  }

  public resize():void {
    this.size = new Point(window.innerWidth, window.innerHeight);
    this.element.width = this.size.x;
    this.element.height = this.size.y;
    this.ctx = this.element.getContext("2d");
  }

  public addObject(object:WorldObject):void {
    this.objectsToAdd.push(object);
    object.world = this;
    object.init(this);
  }

  public getFPS():number {
    return this.fps;
  }

  public resetGravity():void {
    this.gravity = new Point(0, 0);
  }

  private tick():void {
    this.ticks++;
    this.clear();
    this.objects = this.objects.concat(this.objectsToAdd);
    this.objectsToAdd = [];
    this.sortObjects();
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
      dragObject.dragMove(this.pointer.position, this.pointer);
      if (!this.pointer.pressed) {
        dragObject.dragEnd(this.pointer.position, this.pointer);
        dragObject.hover = false;
      } else
        dragObject.hover = true;
    }

    if (this.pointer.pressed && hoverObject && !dragObject)
      hoverObject.dragStart(this.pointer.position, this.pointer);

    this.objects = this.objects.filter((object:WorldObject):boolean => {
      if (!object.drag)
        object.tick(this);
      return !object.removed;
    });
      
    for (let object of this.objects)
      object.render(this.ctx);

    requestAnimationFrame(() => this.tick());
  }

  private getPriorities():Array<number> {
    let result = [];
    for (let object of this.objects)
      if (result.indexOf(object.priority) < 0)
        result.push(object.priority);
    return result.sort();
  }

  private sortObjects():void {
    let result = [];
    for (let priority of this.getPriorities())
      for (let object of this.objects.find(x => x.priority == priority))
        result.push(object);
    if (result.length > 0)
      this.objects = result;
  }

  private clear():void {
    this.ctx.clearRect(0, 0, this.size.x, this.size.y);
  }

  private objectsToAdd:Array<WorldObject>;
}

const world = new World(document.getElementById("canvas"));
for (let i = 0; i < 200; i++) {
  world.addObject(Ball.createRandom(world.size, Rand.getRandomInt(5, 20)));
}
for (let i = 0; i < 10; i++) {
  world.addObject(Ball.createRandom(world.size, Rand.getRandomInt(20, 60)));
}
world.addObject(new GravitySlider(new Point(100, 100), new Point(50, 50)));

document.getElementById("motionSensor").addEventListener("click", () => {
  world.motionSensor = this.checked;
});

document.getElementById("resetGravity").addEventListener("click", () => {
  world.resetGravity();
});

window.addEventListener("resize", () => {
  world.resize();
});

window.addEventListener("mousemove", (event) => {
  world.pointer.update(event.pageX, event.pageY, undefined, event);
  event.preventDefault();
});

window.addEventListener("mousedown", (event) => {
  world.pointer.update(event.pageX, event.pageY, true, event);
  event.preventDefault();
});

window.addEventListener("mouseup", (event) => {
  world.pointer.update(event.pageX, event.pageY, false, event);
  event.preventDefault();
});

window.addEventListener("touchmove", (event) => {
  world.pointer.update(event.changedTouches[0].pageX, event.changedTouches[0].pageY, undefined, event);
  event.preventDefault();
});

window.addEventListener("touchstart", (event) => {
  world.pointer.update(event.changedTouches[0].pageX, event.changedTouches[0].pageY, true, event);
  event.preventDefault();
});

window.addEventListener("touchend", (event) => {
  world.pointer.update(event.changedTouches[0].pageX, event.changedTouches[0].pageY, false, event);
  event.preventDefault();
});

window.addEventListener("devicemotion", function (event) {
  if (world.motionSensor)
    world.gravity = new Point(event.accelerationIncludingGravity.x/10, -event.accelerationIncludingGravity.y/10);
  
});

