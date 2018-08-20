class Player {
  constructor() {

    this.enemiesBound = (function() {
      let _bound = [];
      return {
        getAll: function() {
          return _bound;
        },
        total: function() {
          return _bound.length;
        },
        add: function(s) {
          _bound.push(s);
        },
        clear: function() {
          _bound = [];
        },
        remove: function(s) {
          let a = _bound.filter(f => f != s);
          _bound = a;
        }
      };
    })();


    this.debug = false;
    this.debug = true;

    this.health = 20;

    this.others = {stairs:'stairs', wall:'wall', captive:'captive', empty:'empty', enemy:'enemy'};
    this.directions = ['forward', 'right', 'backward', 'left']
    this.around = {forward:'forward', right:'right', backward:'backward', left:'left'};

    this.directionToBearing = {forward:'north', right:'east', backward:'south', left:'west'};
    this.bearingToDirection = {north:'forward', east:'right',south:'backward',west:'left'};

    this.nextTurn = {action:'', direction:'', stateUpdate:'', debugMessage:''};

    this.turnIndex = 0;
    this.turns = [];
  }

  prepareNextTurn(warrior) {
    const bearing = this.directionToBearing[this.directions[this.directions.map(direction =>
      warrior.look(direction)).map(range =>
        range.map(space =>
          space.getLocation()).filter(location =>
            location[1] > 0).length > 0).indexOf(true)]];

    let nextTurn = {};
    nextTurn.scan = new scanResult;
    nextTurn.scan.bearing = bearing;

    this.directions.forEach(direction => {
      nextTurn.scan.addEntities(direction, bearing, warrior.look(direction))
    })

    nextTurn.scan.addEntities('listen', bearing, warrior.listen());

    //rescue
    const canRescue = this.canRescue(nextTurn.scan.entities)
    if (canRescue) {
      nextTurn.debugMessage ='resscue ' + canRescue;
      nextTurn.action = 'rescue';
      nextTurn.direction = canRescue;
    }
    //walk to captives
    else if (this.canWalkToCaptive(warrior)) {
      nextTurn.debugMessage = 'WalkToCaptive ' + this.canWalkToCaptive(warrior);
      nextTurn.action = 'walk';
      nextTurn.direction = this.canWalkToCaptive(warrior);
    }
    // escape
    else if (this.getEscapeRoute(warrior)) {
      nextTurn.debugMessage ='escape ' + this.getEscapeRoute(warrior);
      nextTurn.action = 'walk';
      nextTurn.direction = this.getEscapeRoute(warrior);
    }
    // bind
    else if (this.canBind(warrior) && (!this.getTickingDistance(warrior) || this.getTickingDistance(warrior) >= 1)) {
      nextTurn.debugMessage ='bind ' + this.canBind(warrior);
      nextTurn.action = 'bind';
      nextTurn.direction = this.canBind(warrior);
    }
    //detonate
    else if (this.canDetonate(warrior) && (!this.getTickingDistance(warrior) || this.getTickingDistance(warrior) >= 2)){
      nextTurn.debugMessage ='detonate ' + this.canDetonate(warrior);
      nextTurn.action = 'detonate';
      nextTurn.direction = this.canDetonate(warrior);
    }
    //attack
    else if (this.canAttack(warrior)){
      nextTurn.debugMessage ='attack ' + this.canAttack(warrior);
      nextTurn.action= 'attack';
      nextTurn.direction = this.canAttack(warrior);
    }
    //walk to enemey
    else if (this.canWalkToEnemy(warrior)) {
      nextTurn.debugMessage ='WalkToEnemy ' + this.canWalkToEnemy(warrior);
      nextTurn.action = 'walk';
      nextTurn.direction = this.canWalkToEnemy(warrior);
    }
    //rest
    else if (this.canRest(warrior)) {
      nextTurn.debugMessage = 'rest ';
      nextTurn.action = 'rest';
    }
    //walk to stairs
    else if (this.canWalkToStairs(warrior)) {
      nextTurn.debugMessage = 'WalkToStairs ' + this.canWalkToStairs(warrior);
      nextTurn.action = 'walk';
      nextTurn.direction = this.canWalkToStairs(warrior);
    }
    else {
      debugger
    }

    this.health = warrior.health()
    return nextTurn;
  }

  playTurn(warrior) {

    let nt = {};
    nt = this.prepareNextTurn(warrior);
    switch (nt.action) {
      case 'rescue':
        warrior.rescue(nt.direction);
        break;
      case 'walk':
        warrior.walk(nt.direction);
        this.enemiesBound.clear();
        break;
      case 'bind':
        warrior.bind(nt.direction);
        this.enemiesBound.add(nt.direction);
        break;
      case 'attack':
        warrior.attack(nt.direction);
        this.enemiesBound.remove(nt.direction);

        break;
      case 'detonate':
        warrior.detonate(nt.direction);
        this.enemiesBound.remove(nt.direction);
        break;
      case 'rest':
        warrior.rest();
        break;

      default:
      debugger
        warrior.think('doing nothing')

    }
    warrior.think(nt.debugMessage + ' in turn ' + (this.turnIndex + 1))

    this.turns[this.turnIndex] = nt;
    this.turnIndex++;

  }

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

  canRescue(entities){
    const captivesAround = entities.filter(e => e.distance == 1 && e.type == 'captive')
    return captivesAround.length > 0 && captivesAround[0].direction;

    // if (this.getCaptivesAround(warrior).length) {
    //   return (this.getCaptivesAround(warrior)[0]);
    // }
    // else {
    //   return false;
    // }
  }

  getLooseEnemies(warrior){
    let enemiesAround = this.getEnemiesAround(warrior).length;
    let enemiesBound = this.enemiesBound.total();

    return enemiesAround > enemiesBound;
  }

  canDetonate(warrior){
    let enemiesAround = this.getEnemiesAround(warrior);
    let allEnemiesInRange = this.getEnemiesLocations(warrior).filter(loc => loc.distance <= 2) || false;
    let firstEnemyInRange = allEnemiesInRange.length ? allEnemiesInRange.map(e => e.direction).sort()[0] : false;//this.getEnemiesLocations(warrior).find(loc => loc.distance >= 1) || false;

    let allCaptives = this.getCaptivesLocations(warrior);
    let allCaptivesInRange = this.getCaptivesLocations(warrior).filter(loc => loc.distance < 3) || false;
    let firstCaptiveInRange = this.getCaptivesLocations(warrior).find(loc => loc.distance < 3) || false;

    let tickingDirection = this.getTickingDirection(warrior);
    let isTickingDirectionEmpty = tickingDirection ? this.isThis('empty', warrior, tickingDirection) : false;
    let inTunnel = this.isRoomTunnel(warrior);


    let mayShoot = allEnemiesInRange.length >= 1 && (allEnemiesInRange.filter(e => !allCaptivesInRange.find(c => c.direction == e.direction || c.distance < 3)))
    let canShoot = mayShoot.length > 0 && mayShoot[0];
    canShoot = (canShoot.direction != tickingDirection && !inTunnel && firstEnemyInRange == canShoot.direction) ? canShoot.direction : false;
    canShoot = !allCaptivesInRange.find(c => c.direction == canShoot) && canShoot;
    let isDying = this.isHealthDying(warrior);
    let looseEnemies = this.getLooseEnemies(warrior)
    let enemeyAheadInTunnel = this.isRoomTunnel(warrior) && !this.isThis('enemy', warrior, 'forward');
    let clearDirectionToTickingCaptive = this.getClearAround(warrior, tickingDirection);

    if (isDying && !clearDirectionToTickingCaptive) {
      return false;
    }
    else if (canShoot && (!clearDirectionToTickingCaptive || inTunnel)) {
      return canShoot;
    }
    else if (allEnemiesInRange.length > 2 && !clearDirectionToTickingCaptive && !firstCaptiveInRange) {
      return firstEnemyInRange;
    }
    else if (firstEnemyInRange && !firstCaptiveInRange && inTunnel) {
      return 'forward';
    }
    else if (firstEnemyInRange && !firstCaptiveInRange && isTickingDirectionEmpty || clearDirectionToTickingCaptive) {
      return clearDirectionToTickingCaptive;
    }
    else if (enemiesAround.length && !firstCaptiveInRange && !clearDirectionToTickingCaptive) {
      return enemiesAround[0];
    }
    else {
      return false;
    }
  }

  canAttack(warrior){
    let allEnemies = this.getEnemiesTotal(warrior);
    let enemies = this.getEnemiesAround(warrior);
    let nextEnemey = enemies[0] || false;
    let canAttackNextEnemey = this.isThis('enemy', warrior, nextEnemey) || false;
    let notDying = !this.isHealthDying(warrior);
    let notClearAroundTicking = !this.getClearAround(this.getTickingDirection)
    let noLooseEnemies = this.getEnemiesAround(warrior).length <= this.enemiesBound.total();
    let noTicking = !this.getTickingDirection;

    if ((noTicking || notClearAroundTicking) && notDying && allEnemies && canAttackNextEnemey && noLooseEnemies) {
      return nextEnemey;
    }
    else {
      return false;
    }
  }

  canBind(warrior){
    let unBound = this.listenToEnemies(warrior).filter( nb => ! nb.getUnit().isBound());
    let enemies = this.getEnemiesAround(warrior);
    let firstEnemyToBind = this.arrayDiff(warrior, enemies, this.enemiesBound.getAll())[0];

    let isDying = this.isHealthDying(warrior);
    let tunnel = this.isRoomTunnel(warrior);
    let tickingDirection = this.getTickingDirection(warrior);
    let escapeRoute = this.getEscapeRoute(warrior);
    let takingDamage = this.isTakingDamage(warrior);
    let looseEnemies = enemies.length >= unBound.length;
    let canBindFirstEnemy = (this.canDetonate(warrior) != firstEnemyToBind) || (this.getEnemiesAround(warrior).length > 2);

    if (!isDying && tunnel && tickingDirection || escapeRoute) {
      return false;
    }
      else if (firstEnemyToBind && (takingDamage || tickingDirection || looseEnemies) && canBindFirstEnemy) {
        return firstEnemyToBind;
      }
      else {
        return false;
      }
    }

    canRest(warrior){
      let isPerfect = this.getHealthLevel(warrior) == 'perfect';
      let notTakingDamage = !this.isTakingDamage(warrior);

      let allEnemies = this.getEnemiesTotal(warrior);
      let enemiesAround = this.getEnemiesAround(warrior).length;
      let enemiesBound = this.enemiesBound.total();
      let looseEnemies = this.getLooseEnemies(warrior);

      let allCaptives = this.getCaptivesLocations(warrior).length;
      let captiveDirection = this.getTickingDirection(warrior);
      let allDone = !allEnemies && !allCaptives;

      if ((notTakingDamage || !enemiesAround) && !(allDone || isPerfect || looseEnemies || captiveDirection)) {
        return true;
      }
      else {
        return false;
      }
    }

    canWalkToEnemy(warrior){
      let allEnemies = this.getEnemiesLocations(warrior);
      let enemiesNext = allEnemies.filter(loc => loc.distance >= 1) || false;
      let enemyNext = enemiesNext.length ? enemiesNext[0].direction : false;

      let lastWalkDirection = this.getLastWalkDirection(warrior);
      let walkedThereBefore = this.getReverseDirection(lastWalkDirection);
      let clearDirectionToEnemeyNext = this.getClearAround(warrior, enemyNext);
      let tickingDirection = this.getTickingDirection(warrior);
      let isDying = this.getHealthLevel(warrior) == 'dying';
      let inTunnel = this.isRoomTunnel(warrior);

      if (tickingDirection || isDying || inTunnel) {
        return false;
      }
      else if (clearDirectionToEnemeyNext) {
          return enemyNext || clearDirectionToEnemeyNext;
        }
        else if (clearDirectionToEnemeyNext) {
          return clearDirectionToEnemeyNext;
        }
      else if (allEnemies.length && this.isDirectionClear(warrior, allEnemies[0].direction)) {
        return allEnemies[0].direction || (allEnemies[0].direction != walkedThereBefore);
      }
      else if (allEnemies.length && this.getClearAround(warrior, allEnemies[0].direction)) {
        return this.getClearAround(warrior, allEnemies[0].direction);
      }
      else {
        return false;
      }
    }

    canWalkToStairs(warrior){
      if (!this.getEnemiesTotal(warrior) && !this.getCaptivessTotal(warrior)) {
        return warrior.directionOfStairs();
      }
      else {
        return false;
      }
    }

    canWalkToCaptive(warrior){
      let allCaptives = this.getAllCaptives(warrior);
      let numOfCaptives = this.getCaptivessTotal(warrior);

      let firstCaptive = numOfCaptives ? allCaptives[numOfCaptives - 1] : false;
      let firstCaptiveDirection = firstCaptive ? warrior.directionOf(firstCaptive) : false;
      let firstCaptiveDirectionIsEmpty = firstCaptiveDirection ? warrior.feel(firstCaptiveDirection).isEmpty() && !warrior.feel(firstCaptiveDirection).isStairs(): false;
      let clearDirectionToFirstCaptive = this.getClearAround(warrior, firstCaptiveDirection);

      let tickingCaptiveDirection = this.getTickingDirection(warrior);
      let tickingCaptiveDirectionIsEmpty = tickingCaptiveDirection ? warrior.feel(tickingCaptiveDirection).isEmpty() && !warrior.feel(tickingCaptiveDirection).isStairs() : false;
      let clearDirectionToTickingCaptive = this.getClearAround(warrior, tickingCaptiveDirection);

      let canDetonate = this.canDetonate(warrior);
      let canWalk = this.canWalkToEnemy(warrior);
      let inTunnel = this.isRoomTunnel(warrior);
      let isDying = this.getHealthLevel(warrior) == 'dying';
      let enemiesLeft = this.getEnemiesTotal(warrior) > 0;

      if (!tickingCaptiveDirection && (canDetonate || enemiesLeft || isDying || (canWalk && !inTunnel))) {
        return false;
      }
      else if (numOfCaptives) {
        if (tickingCaptiveDirection && tickingCaptiveDirectionIsEmpty) {
          return tickingCaptiveDirection;
        }
        else if (!tickingCaptiveDirectionIsEmpty && clearDirectionToTickingCaptive) {
          return clearDirectionToTickingCaptive;
        }
        else if (firstCaptiveDirection && firstCaptiveDirectionIsEmpty && !tickingCaptiveDirection) {
          return firstCaptiveDirection;
        }
        else if(!firstCaptiveDirectionIsEmpty && clearDirectionToFirstCaptive && !tickingCaptiveDirection)
         return clearDirectionToFirstCaptive;
        }
      else {
        return false;
      }
    }

    getEscapeRoute(warrior){
      let so = this.getSpacesAround(warrior)
      let sa = Object.values(so)
      let n = sa.filter(s => s == 'enemy').length
      let e = sa.filter(s => s == 'empty').length
      let w = sa.filter(s => s == 'wall').length

      if (n == 3 && e == 1) {
        return Object.values(this.around)[sa.indexOf('empty')]
      }
    }

    getWhatInDirection(warrior, direction){
      for (let other in this.others) {
        if (this.isThis(other, warrior, direction)) {
          return other
        }
      }
    }

    getunitType(sensedSpace){
      for (let other in this.others) {
        switch (u) {
          case 'stairs':
            return other && sensedSpace.isStairs();
            break;
          case 'wall':
            return other && sensedSpace.isWall();
            break;
          case 'empty':
            return other && sensedSpace.isEmpty() && !sensedSpace.isStairs();
            break;
          case 'enemy':
            return other && sensedSpace.isUnit() && sensedSpace.getUnit().isEnemy();
            break;
          case 'captive':
            return other && sensedSpace.isUnit() && !sensedSpace.getUnit().isEnemy() && sensedSpace.getUnit().isBound() ;
            break;
          default:
            return 'unknown';
        }
      }
    }

    isThis(u, warrior, direction){
      if (!direction){
        return false;
      }
      else {
        switch (u) {
          case 'stairs':
            return warrior.feel(direction).isStairs();
            break;
          case 'wall':
            return warrior.feel(direction).isWall();
            break;
          case 'empty':
            return warrior.feel(direction).isEmpty() && !warrior.feel(direction).isStairs();
            break;
          case 'enemy':
            return warrior.feel(direction).isUnit() && warrior.feel(direction).getUnit().isEnemy();
            break;
          case 'captive':
            return warrior.feel(direction).isUnit() && !warrior.feel(direction).getUnit().isEnemy() && warrior.feel(direction).getUnit().isBound() ;
            break;
          default:
            return false;
        }
      }
    }

    getLastWalkDirection(warrior) {
      let indexOfLastWalk = this.turns.map(turn => turn.action).reverse().indexOf('walk');
      return (indexOfLastWalk >= 0) && (this.turnIndex - indexOfLastWalk >= 0) && (this.turns[this.turnIndex - indexOfLastWalk - 1].direction);
    }

    getClearAround(warrior, direction) {
      let lastWalkDirection = this.getLastWalkDirection(warrior);
      let walkedThereBefore = this.getReverseDirection(lastWalkDirection)
      let clearDirection = false;

      if (this.isDirectionClear(warrior, direction)) {
        return direction;
      }
      else if (!direction) {
        return false;
      }
      else if (!this.isDirectionClear(warrior, direction)) {
          for (let currentDirection in this.around) {
            if ((currentDirection != direction) && (currentDirection != 'backward') && this.isDirectionClear(warrior, currentDirection) && currentDirection != walkedThereBefore) {
              clearDirection = currentDirection;
            }
          }
          if (clearDirection) {
            return clearDirection;
          }
        }
    else {
      return false;
    }
  }

    getReverseDirection(direction){
      switch (direction) {
        case 'right': return 'left';
          break;
        case 'left': return 'right';
          break;
        case 'backward': return 'forward';
          break;
        case 'forward': return 'backward';
          break;
        default: return false;
      }
    }

    isDirectionClear(warrior, direction) {
      if (this.isThis('empty', warrior, direction)) {
        return direction;
      }
      else {
        return false;
      }
    }

    isRoomTunnel(warrior){
      return (this.isThis('wall', warrior, 'right') && this.isThis('wall', warrior, 'left') )
    }

    isHealthPerfect(warrior){
      return this.getHealthLevel(warrior) == 'perfect';
    }

    isHealthInjured(warrior){
      return this.getHealthLevel(warrior) == 'injured';
    }

    isHealthDying(warrior){
      return this.getHealthLevel(warrior) == 'dying';
    }

    getHealthLevel(warrior){
      if (warrior.health() == 20) {
        return 'perfect';
      }
      else if (warrior.health() <= 17 && warrior.health() > 7) {
        return 'injured';
      }
      else if (warrior.health() <= 7) {
        return 'dying';
      }
    }

    isTakingDamage(warrior) {
      return Boolean(warrior.health() < this.health);
    }

    arrayDiff(warrior, arr1, arr2){
      let diffs;
      if (arr2) {
        diffs = arr1.filter(function(obj) {
          return !arr2.some(function(obj2) {
            return obj == obj2;
          });
        })
      }
      else {
        diffs = arr1
      }
      return diffs;
    }

    getTickingDirection(warrior){
      const spaceWithUnit = warrior.listen();
      let swc;
      if (spaceWithUnit.length) {
        swc = spaceWithUnit.find(space => (space.isUnit() && space.getUnit().isUnderEffect('ticking')))
        if (swc) {
          return warrior.directionOf(swc)
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    getTickingDistance(warrior){
      const spaceWithUnit = warrior.listen();
      let swc;
      if (spaceWithUnit.length) {
        swc = spaceWithUnit.find(space => (space.isUnit() && space.getUnit().isUnderEffect('ticking')))
        if (swc) {
          return warrior.distanceOf(swc)
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    getCaptivesAround(warrior){
      let captives = [];
      for (let direction in this.around) {
        if (this.isThis('captive', warrior, direction)) {
          captives.push(direction);
        }
      }
      return captives;
    }

    getCaptivessTotal(warrior){
      let spacesWithUnits = warrior.listen();
      let numOfCaptives = 0
      for (let space of spacesWithUnits) {
        space.getUnit().isBound() && !space.getUnit().isEnemy() ? numOfCaptives++ : false;
      }
      return numOfCaptives;
    }

    getCaptivesLocations(warrior){
      let captives = [];
      for (let captive of this.getAllCaptives(warrior)) {
        captives.push({'distance': warrior.distanceOf(captive),'direction': warrior.directionOf(captive)});
      }
      return captives.sort( (a, b) => a.distance - b.distance);
    }

    getAllCaptives(warrior) {
      const spacesWithCaptives = warrior.listen().filter(space => space.isUnit() && space.getUnit().isBound() && !space.getUnit().isEnemy() );
      return spacesWithCaptives
    }

    listenToEnemies(warrior) {
      const spacesWithEnemies = warrior.listen().filter(space => space.isUnit() && space.getUnit().isEnemy());
      return spacesWithEnemies;
    }

    getEnemiesTotal(warrior){
      return this.listenToEnemies(warrior).length;
    }

    getEnemiesLocations(warrior){
      let enemies = [];
      for (let enemy of this.listenToEnemies(warrior)) {
        enemies.push( {'distance': warrior.distanceOf(enemy),'direction': warrior.directionOf(enemy)} );
      }
      return enemies.sort( (a, b) => a.distance - b.distance);
    }

    getEnemiesAround(warrior) {
      let enemiesAround = [];
      for (let direction in this.around) {
        this.isThis('enemy', warrior, direction) ? enemiesAround.push(direction) : false;
      }
      return enemiesAround;
      // return this.spaces.filter(space => this.calculateDistance(space.getLocation()) == 1);

    }

    getSpacesAround(warrior){
      let around = {};
      for (let direction in this.around) {
        around[direction] = this.getWhatInDirection(warrior, direction)
      }
      return around;
    }
  }

  class scanResult{
    constructor() {
      this.entities = [];

      scanResult.prototype.arraysEqual = function(a, b) {
       if (a === b) return true;
       if (a == null || b == null) return false;
       if (a.length != b.length) return false;

       for (var i = 0; i < a.length; ++i) {
         if (a[i] !== b[i]) return false;
       }
       return true;
     }

      scanResult.prototype.addEntities = function(direction, bearing, spaces) {

        for (let space of spaces) {
          let newEntity = new Entity(space, direction, bearing);
          let entityExists = this.entities.map(entity => this.arraysEqual(entity.location, newEntity.location)).indexOf(true) >= 0;

          if (!entityExists) {
            this.entities.push(newEntity);
          }
        }

        const gridSize = this.grid ?
          Math.max(3,Math.max.apply(null,this.grid.map(s => parseInt(s.length/2)))) :
          Math.max(3,Math.max.apply(3,this.entities.map(s => s.distance)))

        if (!this.grid) {
          this.grid = new Array(gridSize)

          for (var i = 0; i < gridSize * 2 + 1 ; i++) {
            this.grid[i] = new Array(gridSize);
            for (var j = 0; j < gridSize * 2 + 1; j++) {
              this.grid[i][j] = ' ';
            }
          }
          this.grid[gridSize][gridSize] = '@';
        }

        for (const entity of this.entities) {
          this.grid[entity.location[1] + gridSize][entity.location[0] + gridSize] = entity.symbol;
        }

        return this.grid;
      }

    }
  }

  class Entity {
    constructor(space, direction, bearing) {
      const isStairs = space.isStairs();
      const isWall = space.isWall();
      const isEmpty = space.isEmpty() && !isStairs && !isWall;
      const isUnit = space.isUnit();
      const isEnemy = isUnit && space.getUnit().isEnemy();
      const isCaptive = isUnit && !isEnemy && space.getUnit().isBound();
      const isTicking = isCaptive && space.getUnit().isUnderEffect('ticking');

      if (isStairs) {
        this.type = 'stairs';
        this.symbol = 's';
      }
      else if (isWall) {
        this.type = 'wall';
        this.symbol = 'w';
      }
      else if (isEmpty) {
        this.type = 'empty';
        this.symbol = 'e';
      }
      else if (isEnemy) {
        this.type = 'enemy';
        this.symbol = 'x';
        this.initialHp = 3;
        this.bound = false;
      }
      else if (isCaptive) {
        this.type = 'captive';
        this.symbol = 'c';
        this.initialHp = 1;
        this.bound = true;
        this.ticking = isTicking;
      }


      this.space = space;
      this.location = space.getLocation();

      Entity.prototype.getDistance = function(fromPoint = [0,0]) {
        const xDelta = Math.abs(fromPoint[0] - this.location[0]);
        const yDelta = Math.abs(fromPoint[1] - this.location[1]);

        return xDelta + yDelta;
      }

      /**
       * Returns the direction of a location [x,y]
       *
       * @param {number[]} location The location as [x, y].
       *
       * @returns {string} The direction.
       *
     */
      Entity.prototype.getDirectionfromLocation = function(location) {
        let x = location[0];
        let y = location[1];

        if (x > 0 && y >= 0) {
          return 'east';
        }
        else if (x <= 0 && y < 0) {
          return 'south';
        }
        else if (x < 0 && y >= 0) {
          return 'west';
        }
        else if (x == 0 && y > 0) {
          return 'north';
        }
      }

      Entity.prototype.getRelativeDirection = function(direction, bearing) {
          let allDirections = ['north', 'east', 'south', 'west'];
          let allBearings = ['forward','right','backward','left'];

          const indexOfDirection = allDirections.indexOf(direction);
          const indexOfBearing = allDirections.indexOf(bearing);
          const total = allBearings.length

          const index = (indexOfDirection - indexOfBearing + total) % total;

          return allBearings[index];
        }

      this.distance = this.getDistance();
      this.direction = direction != 'listen' ? direction : this.getRelativeDirection(this.getDirectionfromLocation(this.location), bearing);

      if (isUnit) {
        Entity.prototype.isBound = function() {
          return !!this.bound;
        }
        Entity.prototype.bind = function() {
          this.bound = true;
        }
        Entity.prototype.unBind = function() {
          this.bound = false;
        }
        Entity.prototype.isAlive = function() {
          return this.hp > 0;
        }

        Entity.prototype.getDamageEstimate = function(damageType = 'attack') {
          // TODO: change this to something more accurate
          const distance = this.getDistance();

          const bombDamage = 5;
          const attackDamage = 3;

          this.bound = false;
          switch (damageType) {
            case 'attack':
            return attackDamage;
            break;
            case 'bomb':
            return bombDamage - distance + 1;
            break;
            case 'secondary':
            return bombDamage - distance - 1;
            break;
          }
        }
      }
    }
  }
