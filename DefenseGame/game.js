var myGamePiece;
var myBoundaryLine;
var myObstacles = [];
var myBullets = [];
var myScore;
var pewSound;
var myPowerUp = null;
var myPowerUpKey = "";
var powerUps;
var powerUpBank;
var sounds = true;
//make space invaders!!!!
function startGame(){
  myGameArea.start();
  //myGamePiece = new component(30, 30, "red", 10, 240, "nah");
  //myBackground = new component(960, 540, "imgs/space.jpg", 0, 0, "background");
  myGamePiece = new component(40, 70, "imgs/player.png", 30, 240, "image");
  myScore = new component("20px", "serif", "blue", 840, 30, "text");
  myBoundaryLine = new component(5, 540, "rgba(255,0,0,1)", 0.1 * myGameArea.canvas.width + 50, 0, "nah");
  pewSound = new sound("sounds/pew.mp3");
  powerUps = ["triShot"];
  powerUpBank = {
    "triShot" : new component(40, 40, "imgs/powerup.png", myGameArea.canvas.width, 270, "image")
  }; //it seems storing this key is by reference, not value
}

function restartGame(){
  myGameArea.clear();
  myGameArea.restart();
  document.getElementById("restart-button").style.display = "none";
}

var myGameArea = {
  canvas : document.createElement("canvas"),
  start : function() {
    this.canvas.width = 960;
    this.canvas.height = 540;
    this.context = this.canvas.getContext("2d");
    document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    this.frameno = 0;
    this.interval = setInterval(updateGameArea, 20);
    this.lastShot = 0;
    this.borderOpacity = 1;
    this.spawnRate = 100;
    this.upSpawnRate = true;
    window.addEventListener("keydown", function(e) {
      myGameArea.keys = (myGameArea.keys || []);
      myGameArea.keys[e.keyCode] = true;
    });
    window.addEventListener("keyup", function(e) {
      myGameArea.keys[e.keyCode] = false;
    });
  },
  clear : function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },
  stop : function() {
    clearInterval(this.interval);
  },
  restart : function() {
    this.frameno = 0;
    this.lastShot = 0;
    this.borderOpacity = 1;
    myObstacles = [];
    myBullets = [];
    myBoundaryLine.color = "red";
    myScore.score = 0;
    this.interval = setInterval(updateGameArea, 20);
    myGameArea.spawnRate = 50;
    myGamePiece.triShot = false;
    powerUps = ["triShot"];
    for(var key in powerUpBank){
      powerUpBank[key].x = myGameArea.canvas.width;
    }
  }
}

function everyInterval(n){
  return myGameArea.frameno / n % 1 == 0;
}

function component(width, height, color, x, y, type) {
    this.type = type;
    this.abberant = Math.random() >= 0.7;
    this.hitTolerance = 3;
    if(this.type == "image" || this.type == "background"){
      this.image = new Image();
      if(this.abberant && color !== "imgs/player.png" && color !== "imgs/powerup.png"){
        color = "imgs/alien.png";
        width *= .8;
        height *= 1;
        this.hitTolerance = 10;
      }
      this.image.src = color;
    }
    this.width = width;
    this.height = height;
    this.color = color;
    this.speedX = 0;
    this.speedY = 0;
    this.speedAxis = (Math.random() - .5) * myGameArea.canvas.height / 2;
    this.x = x;
    this.y = y;
    this.score = 0;
    this.triShot = false;
    this.update = function() {
      var ctx = myGameArea.context;
      ctx.fillStyle = this.color;
      if(this.type == "text"){
        ctx.font = this.width + " " + this.height;
        ctx.fillText(this.text, this.x, this.y);
      } else if(this.type == "image" || this.type == "background"){
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        if(this.type == "background"){
          ctx.drawImage(this.image, this.x + this.width, this.y, this.width, this.height);
        }
      } else {
        ctx.fillRect(this.x, this.y, this.width, this.height);
      }
    }
    this.newPos = function() {
      this.x += this.speedX;
      this.y += this.speedY;
      if(this.type == "background"){
        if(this.x == -this.width){
          this.x = 0;
        }
      }
  }
  this.crashWith = function(otherobj) {
      var mysides = [this.x, this.x + this.width, this.y, this.y + this.height];
      var objsides = [otherobj.x + otherobj.width, otherobj.x, otherobj.y + otherobj.height, otherobj.y];
      var crash = true;
      if(mysides[0] >= objsides[0] - this.hitTolerance || mysides[1] - this.hitTolerance <= objsides[1] || mysides[2] >= objsides[2] - 3 || mysides[3] - 3 <= objsides[3]) {
        crash = false;
      }
      return crash;
  }
  this.bound = function(){
    var rocktop = 0;
    var rockbottom = myGameArea.canvas.height - this.height;
    var rockleft = 0;
    var rockright = 0.1 * myGameArea.canvas.width;
    if(this.y < rocktop){this.y = rocktop;}
    if(this.y > rockbottom){this.y = rockbottom;}
    if(this.x < rockleft){this.x = rockleft;}
    if(this.x > rockright){this.x = rockright;}
  }
}

function updateGameArea() {
  var x, y;
  for(var i = 0; i < myObstacles.length; i++){
    //if(myObstacles[i] == undefined){continue;}
    //maybe have when an obstacle is hit then it turns into a powerup
    if(myBoundaryLine.crashWith(myObstacles[i]) && myGameArea.borderOpacity > .2){
        myGameArea.borderOpacity -= .2;
        myBoundaryLine.color = "rgba(255,0,0," + myGameArea.borderOpacity + ")";
        delete myObstacles[i];
    }else if(myGamePiece.crashWith(myObstacles[i]) || myObstacles[i].x == 0){
      myGameArea.stop();
      document.getElementById("restart-button").style.display = "block";
      return;
    }
    for(var j = 0; j < myBullets.length; j++){
      if(myObstacles[i] == undefined || myBullets[j] == undefined){continue;}
      if(myObstacles[i].crashWith(myBullets[j])){
        delete myObstacles[i];
        delete myBullets[j];
          myScore.score += 10;
      }
    }
  }
  if(myPowerUp !== null && myGamePiece.crashWith(myPowerUp)){
    myPowerUp = null;
    powerUps.splice(powerUps.indexOf(myPowerUpKey), 1);
    switch(myPowerUpKey){
      case "triShot":
        myGamePiece.triShot = true;
        break;
      default:
        console.log("Missing powerup: " + myPowerUpKey);
    }
  }
  myObstacles = myObstacles.filter(function(obs){
    return obs != undefined;
  });
  myBullets = myBullets.filter(function(bul){
    return bul != undefined;
  });
  myGameArea.clear();
  myGameArea.frameno++;
  if(myScore.score % 100 === 0 && myScore.score !== 0){
    if(myGameArea.upSpawnRate){
      myGameArea.spawnRate = Math.round(myGameArea.spawnRate * .5);
      myGameArea.upSpawnRate = false;
    }
  } else {
    myGameArea.upSpawnRate = true;
  }
  /*
  myBackground.speedX = -1;
  myBackground.newPos();
  myBackground.update(); */ //earlier than all other components
  stop();//this disables the buttons
  move();
  shoot();
  for(var i = 0; i < myBullets.length; i++){
    myBullets[i].x += 5;
    myBullets[i].update();
  }
  if(everyInterval(myGameArea.spawnRate + 30)){
    if(Math.random() < .025 && myPowerUp === null && powerUps.length > 0){
      var index = Math.floor(Math.random() * powerUps.length);
      myPowerUp = powerUpBank[powerUps[index]];
      myPowerUpKey = powerUps[index];
    }
  }
  if(myPowerUp !== null && myPowerUp.x <= -myPowerUp.width){
    myPowerUp.x = myGameArea.canvas.width;
    myPowerUp = null;
  }
  if(myPowerUp !== null){
    myPowerUp.x -= 3;
    myPowerUp.update();
  }
  if(myGameArea.frameno == 1 || everyInterval(myGameArea.spawnRate)){
    var size = Math.random() * 30 + 40;
    x = myGameArea.canvas.width;
    y = (myGameArea.canvas.height - myGameArea.canvas.height / 10) * Math.random() + myGameArea.canvas.height / 20 - size / 2;
    myObstacles.push(new component(size, size * 1.5, "imgs/enemy.png", x, y, "image"));
  }
  myGamePiece.newPos();
  myGamePiece.bound();
  myGamePiece.update();
  for(var i = 0; i < myObstacles.length; i++){
    myObstacles[i].x -= 2;
    if(myObstacles[i].abberant){
      myObstacles[i].speedY += .3 * Math.cos((Math.PI / myGameArea.canvas.height) * (myObstacles[i].y + myObstacles[i].speedAxis));      myObstacles[i].newPos();
    }
    myObstacles[i].update();
  }
  myScore.text = "SCORE: " + myScore.score;
  myScore.update();
    myBoundaryLine.update();

    if (myScore.score === 500) {
        myGameArea.stop();
        window.alert("Congrats! You've won! Check the console");
      console.log("Dsl wl R orpv? Dvoo Qlm, ru blf xzm xizxp gsrh urmzo hgvk, blf'oo urmw lfg. Yfg rg dlm'g yv evib vzhb -- gsrh rh ml grnv gl ivozc! Dvoo zmbdzb, sviv rg rh: HDckz2EgBDo2yd==. Ru blf wl vmw fk xizxprmt rg, xlmtizgh! Koa wlm'g gvoo lgsvi kvlkov gslfts.");
    }
}

function shoot(){
  if(myGameArea.keys && myGameArea.keys[32] && myGameArea.frameno > myGameArea.lastShot + 35){
    pewSound.play();
    myBullets.push(new component(20, 2, "black", myGamePiece.x + myGamePiece.width, myGamePiece.y + myGamePiece.height / 2, "nah"));
    if(myGamePiece.triShot){
      myBullets.push(new component(20, 2, "black", myGamePiece.x + myGamePiece.width/2, myGamePiece.y + myGamePiece.height / 2 - 3, "nah"));
      myBullets.push(new component(20, 2, "black", myGamePiece.x + myGamePiece.width/2, myGamePiece.y + myGamePiece.height / 2 + 3, "nah"));
    }
    myGameArea.lastShot = myGameArea.frameno;
  }
}

function move(){
  /*if(myGameArea.keys && myGamePiece.type == "image"){
    for(var i = 37; i <= 40; i++){
      if(myGameArea.keys[i]){myGamePiece.image.src = "imgs/spaceshipGo.png";}
    }
  }*/
  if(myGameArea.keys && myGameArea.keys[37]){accelerateleft();}
  if(myGameArea.keys && myGameArea.keys[38]){accelerateup();}
  if(myGameArea.keys && myGameArea.keys[39]){accelerateright();}
  if(myGameArea.keys && myGameArea.keys[40]){acceleratedown();}
}
function accelerateup() {
  myGamePiece.speedY += -10;
}
function acceleratedown() {
  myGamePiece.speedY += 10;
}
function accelerateleft() {
  myGamePiece.speedX += -2;
}
function accelerateright() {
  myGamePiece.speedX += 2;
}

function stop() {
  /*if(myGamePiece.type == "image"){
    myGamePiece.image.src = "imgs/spaceship.png";
  }*/
  myGamePiece.speedX = 0;
  myGamePiece.speedY = 0;
}

function sound(src){
  this.sound = document.createElement("audio");
  this.sound.src = src;
  this.sound.setAttribute("preload","auto");
  this.sound.setAttribute("controls","none");
  this.sound.style.display = "none";
  document.body.appendChild(this.sound);
  this.play = function(){
    if(sounds){
      this.sound.currentTime = 0;
      this.sound.play();
    }
  }
  this.stop = function(){
    this.sound.pause();
  }
}
function toggleSound(){
  sounds = !sounds;
}
