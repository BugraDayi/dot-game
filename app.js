
var express = require('express');
var app = express();
var serv = require('http').Server(app);


app.get('/',function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2003);
console.log("Server started.");

var SOCKET_LIST = {};
var PLAYER_LIST = {};
var BULLET_LIST = {};
var BONUS_LIST = {};
var BULLET_DAMAGE = 40;
var BULLET_DOWN = 4;

var walls = [];

process.argv.forEach(function (val, index, array) {
  if (val === "hardcore") {
    BULLET_DAMAGE = 100;
    BULLET_DOWN = 20;
  }
});

switch(process.argv[2])
{
  case 'iceworld':
    walls = JSON.parse('[{"x":242,"y":22,"width":10,"height":170},{"x":254,"y":28,"width":158,"height":10},{"x":408,"y":32,"width":10,"height":154},{"x":260,"y":192,"width":154,"height":10},{"x":250,"y":404,"width":10,"height":152},{"x":258,"y":552,"width":156,"height":10},{"x":260,"y":412,"width":160,"height":10},{"x":420,"y":416,"width":10,"height":148},{"x":608,"y":34,"width":176,"height":10},{"x":616,"y":44,"width":10,"height":142},{"x":616,"y":186,"width":170,"height":10},{"x":786,"y":38,"width":10,"height":154},{"x":622,"y":410,"width":10,"height":136},{"x":628,"y":416,"width":140,"height":10},{"x":632,"y":548,"width":150,"height":10},{"x":780,"y":416,"width":10,"height":140},{"x":268,"y":236,"width":10,"height":114},{"x":752,"y":244,"width":10,"height":106},{"x":894,"y":294,"width":108,"height":10},{"x":112,"y":306,"width":2,"height":10},{"x":6,"y":314,"width":112,"height":10}]');
  break;

  case 'iceworld2':
    walls.push({x:270,y:40,width:130,height:10});
    walls.push({x:270,y:40,width:10,height:210});
    walls.push({x:270,y:240,width:130,height:10});
    walls.push({x:390,y:40,width:10,height:210});


    walls.push({x:610,y:40,width:130,height:10});
    walls.push({x:610,y:40,width:10,height:210});
    walls.push({x:610,y:240,width:130,height:10});
    walls.push({x:740,y:40,width:10,height:210});


    walls.push({x:610,y:340,width:130,height:10});
    walls.push({x:610,y:340,width:10,height:210});
    walls.push({x:610,y:550,width:130,height:10});
    walls.push({x:740,y:340,width:10,height:220});


    walls.push({x:270,y:340,width:130,height:10});
    walls.push({x:270,y:340,width:10,height:210});
    walls.push({x:270,y:550,width:130,height:10});
    walls.push({x:390,y:340,width:10,height:210});

  break;

  default:
    walls.push({x:130,y:130,width:330,height:10});
    walls.push({x:540,y:130,width:370,height:10});
    walls.push({x:950,y:130,width:40,height:10});
    walls.push({x:90,y:460,width:370,height:10});
    walls.push({x:10,y:460,width:40,height:10});
    walls.push({x:540,y:460,width:330,height:10});

    walls.push({x:130,y:130,width:10,height:340});
    walls.push({x:860,y:130,width:10,height:340});
    walls.push({x:220,y:200,width:10,height:200});
    walls.push({x:770,y:200,width:10,height:200});
    walls.push({x:220,y:240,width:480,height:10});
    walls.push({x:300,y:350,width:480,height:10});

    walls.push({x:150,y:70,width:10,height:60});
    walls.push({x:70,y:150,width:60,height:10});
    walls.push({x:870,y:440,width:60,height:10});
    walls.push({x:840,y:470,width:10,height:60});

    walls.push({x:420,y:10,width:10,height:60});
    walls.push({x:570,y:70,width:10,height:60});
    walls.push({x:420,y:470,width:10,height:60});
    walls.push({x:570,y:530,width:10,height:60});
  break;
}

walls.push({x:0,y:0,width:1000,height:10});
walls.push({x:990,y:0,width:10,height:600});
walls.push({x:0,y:590,width:1000,height:10});
walls.push({x:0,y:0,width:10,height:600});

const bulletLimit = 15;
const hpLimit = 10;
const allLimit = 25;

function bonusParser() {
  var bulletCounter = 0;
  var hpCounter = 0;
  var allCounter = 0;

  for (var obj in BONUS_LIST) {
    allCounter++;
    BONUS_LIST[obj].type == 1 ? bulletCounter++ : hpCounter++;
  }

  return {'bulletCounter':bulletCounter,'hpCounter':hpCounter, 'allCounter' : allCounter};
}

var Bonus = function(id,type){

  var self = {
    id:id,
    type:type,
    x:0,
    y:0,
  }
  self.init = function(){

    //self.type = Math.round(Math.random()*2);
    if (self.type === 1){ // type = ammo
      if(Math.random() < 0.33){ // zone 1
        self.x = 151 + Math.floor(Math.random()*50);
        self.y = 221 + Math.floor(Math.random()*150);
      } else {// zone 2
        self.x = 791 + Math.floor(Math.random()*50);
        self.y = 221 + Math.floor(Math.random()*150);
      }
    } else { // type = hp
      var rand = Math.random();
      if(rand < 0.33){ // zone 1
        self.x = 21 + Math.floor(Math.random()*90);
        self.y = 481 + Math.floor(Math.random()*90);
      } else if(rand > 0.33 && rand < 0.67) { // zone 2
        self.x = 881 + Math.floor(Math.random()*90);
        self.y = 21 + Math.floor(Math.random()*90);
      } else { // zone 3
        self.x = 431 + Math.floor(Math.random()*130);
        self.y = 261 + Math.floor(Math.random()*70);
      }
    }
  }
  self.checkIfTaken = function(){
    for(var i in PLAYER_LIST){
      var player = PLAYER_LIST[i];
      if (player.x >= self.x-5 &&
        player.x <= self.x+14 &&
        player.y >= self.y-5 &&
        player.y <= self.y+14
      ){
        if (this.type === 1){ // ammo
          if (player.ammo < 100){
            player.ammo = 100;
            var player_socket = SOCKET_LIST[player.id];
            player_socket.emit("ammo_pickedup");
            delete BONUS_LIST[self.id];
            for(var i in SOCKET_LIST){
              var socket = SOCKET_LIST[i];
              socket.emit('patricleEffect',{type:4,x:self.x,y:self.y,color:'orange'});
            }
          }
        } else { // hp
          if (player.hp < 100 || player.stamina < 100){
            player.hp = 100;
            player.stamina = 100;
            var player_socket = SOCKET_LIST[player.id];
            player_socket.emit("hp_pickedup");
            delete BONUS_LIST[self.id];
            for(var i in SOCKET_LIST){
              var socket = SOCKET_LIST[i];
              socket.emit('patricleEffect',{type:4,x:self.x,y:self.y,color:'green'});
            }
          }
        }
      }
    }
  }
  return self;
}

var Bullet = function(id,x,y,angle,parentId){
  var self = {
    id:id,
    x:x,
    y:y,
    angle:angle,
    spdX:Math.cos(angle*Math.PI/180) * 20,
    spdY:Math.sin(angle*Math.PI/180) * 20,
    parentId:parentId,
    color:"#ffffff",
  }
  self.updatePosition = function(){
    self.x += self.spdX;
    self.y += self.spdY;
    if (isCollision(5,self.x,self.y)){
      delete BULLET_LIST[self.id];
    }
    else if (isSomeoneHit(self.x,self.y,self.parentId)){
      delete BULLET_LIST[self.id];
    }
  }
  return self;
}

var Knife = function(id,x,y,parentId) {
  var self = {
    id:id,
    x:x,
    y:y,
    parentId:parentId
  }

  isSomeoneStab(self.x,self.y,self.parentId)

  return self;
}

var Player = function(id){
  var self = {
    x:0,
    y:0,
    id:id,
    name:"",
    team:"",
    inGame:false,
    angle:Math.random()*360,
    score:0,
    maxSpd:2,
    pressingRight:false,
    pressingLeft:false,
    pressingUp:false,
    pressingDown:false,
    pressingShift: false,
    ammo:100,
    hp:100,
    stamina: 100,
    dead:false,
    respawnCounter:0,
  }
  self.updatePosition = function(){
    if(self.pressingRight && isCollision(1,self.x,self.y) !== true)
      self.x += self.maxSpd;
    if(self.pressingLeft && isCollision(3,self.x,self.y) !== true)
      self.x -= self.maxSpd;
    if(self.pressingUp && isCollision(4,self.x,self.y) !== true)
      self.y -= self.maxSpd;
    if(self.pressingDown && isCollision(2,self.x,self.y) !== true)
      self.y += self.maxSpd;
    if (self.pressingShift) {
      if (self.stamina > 0) {
        self.maxSpd = 2;
        self.stamina -= 0.5;
      } else {
        self.maxSpd = 1;
      }
    } else {
      self.maxSpd = 1;
      if (self.stamina < 100) {
        self.stamina += 0.15;
      }
    }


    if(self.respawnCounter > 0){
      self.respawnCounter--;
    } else {
      if (self.dead === true) {
        if(self.team === '#E22D22'){
          self.x = Math.random()*100+20;
          self.y = Math.random()*100+20;
        } else {
          self.x = Math.random()*100+880;
          self.y = Math.random()*100+480;
        }
        self.dead = false;
        for(var i in SOCKET_LIST){
          var socket = SOCKET_LIST[i];
          socket.emit('patricleEffect',{type:4,x:self.x,y:self.y,color:self.team});
        }
      }
    }
  }
  return self;
}

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
  socket.id = Math.random();
  SOCKET_LIST[socket.id] = socket;

  var player = Player(socket.id);
  PLAYER_LIST[socket.id] = player;

  socket.emit('initPack',{
    selfId:socket.id,
    walls:walls,
  });

  socket.on('disconnect',function(){
    delete SOCKET_LIST[socket.id];
    delete PLAYER_LIST[socket.id];
  });

  socket.on('keyPress',function(data){
    if(player.dead === false){
      if(data.inputId === 'left')
        player.pressingLeft = data.state;
      else if(data.inputId === 'right')
        player.pressingRight = data.state;
      else if(data.inputId === 'up')
        player.pressingUp = data.state;
      else if(data.inputId === 'down')
        player.pressingDown = data.state;
      else if(data.inputId === 'shift')
        player.pressingShift = data.state;
      else if(data.inputId === 'click'){
        player.angle = data.angle;
        if (player.ammo > 0) {
          player.ammo -= BULLET_DOWN;
          var id = Math.random();
          var bullet = Bullet(id,player.x,player.y,player.angle,player.id);
          bullet.updatePosition();
          BULLET_LIST[id] = bullet;
        }
      }
      else if(data.inputId === 'space'){
        var knife = Knife(id,player.x,player.y,player.id);
      }
    }
  });

  socket.on('playerJoined',function(data){
    player.name = data.name;
    player.team = data.team;
    player.inGame = true;

    if (data.team === 'auto'){
      var redCount = 0;
      var blueCount = 0;
      for(var i in PLAYER_LIST){
        if(PLAYER_LIST[i].team === '#E22D22'){ //red
          redCount++;
        } else if(PLAYER_LIST[i].team === '#324B9B'){ //blue
          blueCount++;
        }
      }
      if(blueCount > redCount){
        player.team = '#E22D22';
      } else {
        player.team = '#324B9B';
      }
    }

    if(player.team === '#E22D22'){
      player.x = Math.random()*100+20;
      player.y = Math.random()*100+20;
    } else {
      player.x = Math.random()*100+880;
      player.y = Math.random()*100+480;
    }
  });

  socket.on('chatMessage',function(data){
    var message = PLAYER_LIST[data.id].name + ': ' + data.message
    for(var i in SOCKET_LIST){
      var socket = SOCKET_LIST[i];
      socket.emit('chatMessageToDisplay',message);
    }
  });
});

setInterval(function(){
  // bonus creation
  if( Math.floor(Math.random() * 100) + 1 < 5)
  {
    if(Object.keys(BONUS_LIST).length < allLimit)
    {
      var id = Math.random();
      var type = bonusParser().bulletCounter < bulletLimit ? 1 :  0;

      var bonus = Bonus(id,type);
      bonus.init();
      BONUS_LIST[id] = bonus;
    }

    //console.log('New bonus');
    //console.log('Bonuses: ' + Object.keys(BONUS_LIST).length);
  }

  var pack = [];
  var bullets_pack = [];
  var bonus_pack = [];
  for(var i in PLAYER_LIST){
    var player = PLAYER_LIST[i];
    player.updatePosition();
    pack.push({
      x:player.x,
      y:player.y,
      name:player.name,
      team:player.team,
      angle:player.angle,
      score:player.score,
      id:SOCKET_LIST[i].id,
      ammo:player.ammo,
      hp:player.hp,
      stamina:player.stamina,
      inGame:player.inGame,
      dead:player.dead,
    });
  }
  for (var i in BULLET_LIST){
    var bullet = BULLET_LIST[i];
    bullets_pack.push({
      x:bullet.x,
      y:bullet.y,
      angle:bullet.angle,
      color:bullet.color,
    });
    bullet.updatePosition();
  }
  for (var i in BONUS_LIST){
    var bonus = BONUS_LIST[i];
    bonus_pack.push({
      x:bonus.x,
      y:bonus.y,
      type:bonus.type,
    });
    bonus.checkIfTaken();
  }
  for(var i in SOCKET_LIST){
    var socket = SOCKET_LIST[i];
    socket.emit('updatePack',{pack,bullets_pack,bonus_pack});
  }
},20);

var isCollision = function(type, selfX, selfY){ // 1-right 2-down 3-left 4-up 5-bullet
  var posX = selfX;
  var posY = selfY;
  for (var i in walls){
    var wall = walls[i];

    if (type === 1 &&
      posX+7 + 4 > wall.x &&
      posX-7 + 4 < wall.x + wall.width &&
      posY+7 > wall.y &&
      posY-7 < wall.y + wall.height
    ){
      return true;
    }
    else if (type === 2 &&
      posX+7 > wall.x &&
      posX-7 < wall.x + wall.width &&
      posY+7 + 4 > wall.y &&
      posY-7 + 4 < wall.y + wall.height
    ){
      return true;
    }
    else if (type === 3 &&
      posX+7 - 4 > wall.x &&
      posX-7 - 4 < wall.x + wall.width &&
      posY+7 > wall.y &&
      posY-7 < wall.y + wall.height
    ){
      return true;
    }
    else if (type === 4 &&
      posX+7 > wall.x &&
      posX-7 < wall.x + wall.width &&
      posY+7 - 4 > wall.y &&
      posY-7 - 4 < wall.y + wall.height
    ){
      return true;
    }
    else if (type === 5 &&
      posX > wall.x &&
      posX < wall.x + wall.width &&
      posY > wall.y &&
      posY < wall.y + wall.height
    ){
      for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('patricleEffect',{type:3,x:posX,y:posY,color:'black'});
      }
      return true;
    }
  }
}

var isSomeoneHit = function(bulletX,bulletY,parentId) {
  for (var i in PLAYER_LIST){
    var player = PLAYER_LIST[i];
    var d = Math.sqrt( (bulletX-player.x)*(bulletX-player.x) + (bulletY-player.y)*(bulletY-player.y) );
    if (d < 7){
      PLAYER_LIST[i].hp -= BULLET_DAMAGE;
      PLAYER_LIST[i].stamina -= 50;
      if(PLAYER_LIST[i].hp <= 0){
        PLAYER_LIST[i].hp = 100;
        PLAYER_LIST[i].ammo = 100;
        PLAYER_LIST[i].stamina = 100;
        PLAYER_LIST[parentId].score++;
        player.dead = true;
        player.pressingRight = false,
        player.pressingLeft = false,
        player.pressingUp = false,
        player.pressingDown = false,
        player.pressingShift = false,
        player.respawnCounter = 100;
        player.x = -20;
        player.y = -20;

        for(var i in SOCKET_LIST){
          var socket = SOCKET_LIST[i];
          socket.emit('patricleEffect',{type:1,x:bulletX,y:bulletY,color:player.team});
        }
      } else {
        for(var i in SOCKET_LIST){
          var socket = SOCKET_LIST[i];
          socket.emit('patricleEffect',{type:2,x:bulletX,y:bulletY,color:player.team});
        }
      }
      return true;
    }
  }
}

var isSomeoneStab = function(knifeX,knifeY,parentId) {
  for (var i in PLAYER_LIST){
    var player = PLAYER_LIST[i];
    if ((player.id != PLAYER_LIST[parentId].id) && (player.team != PLAYER_LIST[parentId].team)) {
      var d = Math.sqrt( (knifeX-player.x)*(knifeX-player.x) + (knifeY-player.y)*(knifeY-player.y) );
      if (d < 50){
          player.hp -= BULLET_DAMAGE / 2;
          if(player.hp <= 0){
            player.hp = 100;
            player.ammo = 100;
            PLAYER_LIST[parentId].score++;
            player.dead = true;
            player.pressingRight = false,
            player.pressingLeft = false,
            player.pressingUp = false,
            player.pressingDown = false,
            player.pressingShift = false,
            player.respawnCounter = 100;
            player.x = -20;
            player.y = -20;

            for(var i in SOCKET_LIST){
              var socket = SOCKET_LIST[i];
              socket.emit('patricleEffect',{type:1,x:knifeX,y:knifeY,color:player.team});
            }
          } else {
            for(var i in SOCKET_LIST){
              var socket = SOCKET_LIST[i];
              socket.emit('patricleEffect',{type:2,x:knifeX,y:knifeY,color:player.team});
            }
          }
        }
      // return true;
    }
  }
}
