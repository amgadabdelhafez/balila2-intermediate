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

    this.nextTurn = {action:'', direction:'', stateUpdate:'', debugMessage:''};

    this.turnIndex = 0;
    this.turns = [];
  }

  prepareNextTurn(warrior) {
    let nextTurn = {};
    nextTurn.scan = this.getScanResult(warrior);
    const firstCaptiveAround = this.getFirstCaptiveAround(nextTurn.scan.entities);
    // const escapeRoute = this.getEscapeRoute(nextTurn.scan.entities);
    // const newWalk = this.NEWcanWalkToCaptive(nextTurn.scan.entities);
    const scoutReport = this.getScoutReport(nextTurn.scan, [0,0], []);
    const canReposition = Object.keys(scoutReport[[0,0]].potentialLocations).length > 0 && (Object.values(Object.values(scoutReport[[0,0]].potentialLocations)[0])[0].maxEnemiesScore > scoutReport[[0,0]].maxEnemiesScore) && Object.keys(scoutReport[[0,0]].potentialLocations)[0];
    const canDetonate = Object.keys(scoutReport[[0,0]].potentialLocations).length > 0 &&  (Object.values(Object.values(scoutReport[[0,0]].potentialLocations)[0])[0].maxEnemiesScore < scoutReport[[0,0]].maxEnemiesScore) && scoutReport[[0,0]].maxEnemiesDirection;

    //rescue captive around
    if (firstCaptiveAround) {
      nextTurn.debugMessage ='can rescue ' + firstCaptiveAround.type + ' at direction ' + firstCaptiveAround.relativeDirection;
      nextTurn.action = 'rescue';
      nextTurn.direction = firstCaptiveAround.relativeDirection;
    }

    //walk to empty space
    else if (canReposition) {
      nextTurn.debugMessage ='re-position ' + canReposition;
      nextTurn.action = 'walk';
      nextTurn.direction = canReposition;
    }
    //detonate at direction with max damage
    else if (canDetonate) {
      nextTurn.debugMessage ='detonate ' + canDetonate;
      nextTurn.action = 'detonate';
      nextTurn.direction = canDetonate;
    }

    //walk to captives
      else if (this.canWalkToCaptive(warrior)) {
        nextTurn.debugMessage = 'WalkToCaptive ' + this.canWalkToCaptive(warrior);
        nextTurn.action = 'walk';
        nextTurn.direction = this.canWalkToCaptive(warrior);
      }

    //detonate
    // else if (scoutReport.enemiesMaxScore && warrior.health() > 4 && (!this.getTickingDistance(warrior) || this.getTickingDistance(warrior) >= 2)){
    //   nextTurn.debugMessage ='detonate ' + scoutReport.enemiesMaxScore;
    //   nextTurn.action = 'detonate';
    //   nextTurn.direction = scoutReport.enemiesMaxScore;
    // }

    //Refactor WIP
            // bind
            else if (this.canBind(warrior) && (!this.getTickingDistance(warrior) || this.getTickingDistance(warrior) >= 1)) {
              nextTurn.debugMessage ='bind ' + this.canBind(warrior);
              nextTurn.action = 'bind';
              nextTurn.direction = this.canBind(warrior);
            }

            //attack
            else if (this.canAttack(warrior)){
              nextTurn.debugMessage ='attack ' + this.canAttack(warrior);
              nextTurn.action= 'attack';
              nextTurn.direction = this.canAttack(warrior);
            }
            //walk to enemey
            else if (this.canWalkToEnemy(warrior)) {
              // nextTurn.debugMessage ='WalkToEnemy ' + this.canWalkToEnemy(warrior);
              // nextTurn.action = 'walk';
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

          getScanResult(warrior) {
            const directions = ['forward', 'right', 'backward', 'left'];
            const relativeToRefernceDirection = {forward:'north', right:'east', backward:'south', left:'west'};

            const referenceDirection = relativeToRefernceDirection[directions[directions.map(direction =>
              warrior.look(direction)).map(range =>
                range.map(space =>
                  space.getLocation()).filter(location =>
                    location[1] > 0).length > 0).indexOf(true)]];

            let scan = new scanResult;
            scan.referenceDirection = referenceDirection;

            directions.forEach(direction => {
              scan.addEntities(direction, referenceDirection, warrior.look(direction))
            })

            scan.addEntities('listen', referenceDirection, warrior.listen());
            return scan;
          }

          getScoutReport(scanResult, origin, previousLocations) {
            if (!previousLocations.includes(origin)) {
              previousLocations.push(origin);
            }
            else {
              return;
            }

            let allSurrondingLocations = this.getSurrondingLocations(origin);
            let surrondingLocations = {};
            for (let surrondingLocation in allSurrondingLocations) {
              surrondingLocations[surrondingLocation] = allSurrondingLocations[surrondingLocation];
            }

            let allEmptyLocations;
            let emptyLocationsAround;
            let potentialLocations = {};

            if (previousLocations.length <= 2) {
              allEmptyLocations = scanResult.entities.filter(e => e.type === 'empty' && !scanResult.arraysEqual(e.location,origin)).map(entityLocation => entityLocation.location);
              emptyLocationsAround = allEmptyLocations.filter(emptyLocation => !Object.values(surrondingLocations).includes(emptyLocation));
            }

            const entities = Object.values(scanResult.entities)
            const enemies = entities.filter(entity => entity.type === 'enemy');
            const captives = entities.filter(entity => entity.type === 'captive');

            let captivesScores = {};
            let enemiesScores = {};
            let surrondingRanges = {};

            for (let locationDirection in surrondingLocations) {
              surrondingRanges[locationDirection] = this.getSurrondingLocations(surrondingLocations[locationDirection]);
              for (let rangeDirection in surrondingRanges[locationDirection]) {
                if (surrondingRanges[locationDirection][rangeDirection][0] === origin[0] && surrondingRanges[locationDirection][rangeDirection][1] === origin[1]) {
                }
              }
            }

            for (let direction in surrondingRanges) {
              enemiesScores[direction] = 0;
              captivesScores[direction] = 0;
               if (enemies.find(enemy => scanResult.arraysEqual(enemy.location, surrondingLocations[direction]))) {
                 enemiesScores[direction] += 4;
               }
               if (captives.find(captive => scanResult.arraysEqual(captive.location, surrondingLocations[direction]))) {
                 captivesScores[direction] += 10;
                 enemiesScores[direction] = -20;
               }

              for (let currentSurroundingSpace in surrondingRanges[direction]) {
                 if (enemies.find(enemy => scanResult.arraysEqual(enemy.location, surrondingRanges[direction][currentSurroundingSpace]))) {
                   enemiesScores[direction] += 2;
                 }
                 if (captives.find(captive => scanResult.arraysEqual(captive.location, surrondingRanges[direction][currentSurroundingSpace]))) {
                   captivesScores[direction] += 5;
                   enemiesScores[direction] = -20;
                 }
               }
             }

            if (previousLocations.length <= 2) {
              for (let emptyLocation in emptyLocationsAround) {
                if (!scanResult.arraysEqual(Object.values(potentialLocations), emptyLocationsAround[emptyLocation])) {
                  potentialLocations[this.getDirectionFromLocation(emptyLocationsAround[emptyLocation])] = this.getScoutReport(scanResult, emptyLocationsAround[emptyLocation], previousLocations);
                }
              }
            }

            const maxScore = function(scores) {
              const max = Math.max.apply(Math, Object.values(scores));
              if (max === 0) {
                return false
              }
              else {
                for (let score in scores) {
                  if (scores[score] === max && max > 0) {
                    return score;
                  }
                }
              }
            };

            let result = {};
            result[origin] = {
              'maxEnemiesScore': enemiesScores[maxScore(enemiesScores)],
              'maxEnemiesDirection': maxScore(enemiesScores),
              'allEnemiesScores': enemiesScores,

              'maxCaptivessScore': captivesScores[maxScore(captivesScores)],
              'maxCaptivesDirection': maxScore(captivesScores),
              'allCaptivesScores': captivesScores,

              'potentialLocations': potentialLocations
            };
             return result;
          }

            getSurrondingLocations(location) {
              return {
                'forward': [location[0] + 1, location[1] + 0],
                'right': [location[0] + 0, location[1] + 1],
                'backward': [location[0] - 1, location[1] + 0],
                'left': [location[0] + 0, location[1] - 1]
              };
            }

            getDirectionFromLocation(location){
              let result;
              if (location[0] === 1 && location[1] === 0) {
                result = 'forward';
              }
              else if (location[0] === 0 && location[1] === 1) {
                result = 'right';
              }
              else if (location[0] === -1 && location[1] === 0) {
                result = 'backward';
              }
              else if (location[0] === 0 && location[1] === -1) {
                result = 'left';
              }
              return result;
            }

            getFirstCaptiveAround(entities) {
              const captivesAround = entities.filter(e => e.distance === 1 && e.type === 'captive');
              return captivesAround.length > 0 && captivesAround[0];
            }

            getEscapeRoute(entities){
              const enemiesAround = entities.filter(e => e.distance === 1 && e.type === 'enemy');
              const emptyAround = entities.filter(e => e.distance === 1 && e.type === 'empty');

              return  (enemiesAround.length === 3 && emptyAround.length === 1) && emptyAround[0].relativeDirection;
            }

            NEWcanWalkToCaptive(entities){
              const surrondingEntities = entities.filter(e => e.distance === 1 && (e.type === 'enemy' || e.type === 'empty' || e.type === 'wall'));
              const emptySpacesAround = entities.filter(e => e.distance === 1 && e.type === 'empty');
              const allCaptives = entities.filter(e => e.type === 'captive');

              const t = allCaptives.map(c => [c.relativeDirection,c.distance]).map(c => emptySpacesAround.find(e => e === c[0]));
              return allCaptives.map(c => surrondingEntities.find(e => e === c));

            }

          /*=============================================>>>>>
          = ending refactoring here =

          functions refactored
          canDetonate

          new Functions
          getScanResult
          getSurrondingLocations
          getFirstCaptiveAround
          canWalkToCaptive2
          canDetonate
          /*= End of ending refactoring here =*/
          /*=============================================<<<<<*/

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

              let canDetonate = false;//this.canDetonate(warrior);
              let canWalk = this.canWalkToEnemy(warrior);
              let inTunnel = this.isRoomTunnel(warrior);
              let isDying = this.getHealthLevel(warrior) === 'dying';
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

            getLooseEnemies(warrior){
              let enemiesAround = this.getEnemiesAround(warrior).length;
              let enemiesBound = this.enemiesBound.total();

              return enemiesAround > enemiesBound;
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
              let firstEnemyToBind = this.arrayDiff(enemies, this.enemiesBound.getAll())[0];

              let isDying = this.isHealthDying(warrior);
              let tunnel = this.isRoomTunnel(warrior);
              let tickingDirection = this.getTickingDirection(warrior);
              let escapeRoute = false;//this.getEscapeRoute(warrior);
              let takingDamage = this.isTakingDamage(warrior);
              let looseEnemies = enemies.length >= unBound.length;
              let canBindFirstEnemy = this.getEnemiesAround(warrior).length > 2;
              // let canBindFirstEnemy = (this.canDetonate(warrior) != firstEnemyToBind) || (this.getEnemiesAround(warrior).length > 2);

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
              let isPerfect = this.getHealthLevel(warrior) === 'perfect';
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
              let isDying = this.getHealthLevel(warrior) === 'dying';
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
              return this.getHealthLevel(warrior) === 'perfect';
            }

            isHealthInjured(warrior){
              return this.getHealthLevel(warrior) === 'injured';
            }

            isHealthDying(warrior){
              return this.getHealthLevel(warrior) === 'dying';
            }

            getHealthLevel(warrior){
              if (warrior.health() === 20) {
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

            arrayDiff(arr1, arr2){
              let diffs;
              if (arr2) {
                diffs = arr1.filter(function(obj) {
                  return !arr2.some(function(obj2) {
                    return obj === obj2;
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
              // return this.spaces.filter(space => this.calculateDistance(space.getLocation()) === 1);

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
                if (a === null || b === null) return false;
                if (a.length != b.length) return false;
                for (var i = 0; i < a.length; ++i) {
                  if (a[i] !== b[i]) return false;
                }
                return true;
              }

              scanResult.prototype.arraysDiff = function(a, b) {
                let diffs;
                if (b) {
                  diffs = a.filter(function(obj) {
                    return !b.some(function(obj2) {
                      return obj === obj2;
                    });
                  })
                }
                else {
                  diffs = a
                }
                return diffs;
              }

              scanResult.prototype.addEntities = function(direction, referenceDirection, spaces) {
                for (let space of spaces) {
                  let newEntity = new Entity(space, direction, referenceDirection);
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
            constructor(entitySpace, entityDirection, referenceDirection) {

              Entity.prototype.getEntityType = function(space) {
                const isStairs = space.isStairs();
                const isWall = space.isWall();
                const isEmpty = space.isEmpty() && !isStairs && !isWall;
                const isUnit = space.isUnit();
                const isEnemy = isUnit && space.getUnit().isEnemy();
                const isCaptive = isUnit && !isEnemy && space.getUnit().isBound();
                const isTicking = isCaptive && space.getUnit().isUnderEffect('ticking');

                let type, symbol, initialHp, bound;

                if (isStairs) {
                  type = 'stairs';
                  symbol = 's';
                }
                else if (isWall) {
                  type = 'wall';
                  symbol = 'w';
                }
                else if (isEmpty) {
                  type = 'empty';
                  symbol = 'e';
                }
                else if (isEnemy) {
                  type = 'enemy';
                  symbol = 'x';
                  initialHp = 3;
                  bound = false;
                }
                else if (isCaptive) {
                  type = 'captive';
                  symbol = 'c';
                  initialHp = 1;
                  bound = true;
                }
                return [type, symbol, initialHp, isTicking, bound];
              }

              Entity.prototype.getDistance = function(locationOffset) {
                /**
                * Returns the manhattan distance of a location
                * takes locationOffset of a space ([x, y] = the relative offset [forward, right])
                * @param {number[]} locationOffset The locationOffset as [x, y] (the offset [forward, right])
                * @returns {string} The distance
                *
                */
                const xDelta = Math.abs(0 - locationOffset[0]);
                const yDelta = Math.abs(0 - locationOffset[1]);

                return (xDelta + yDelta);
              }

              Entity.prototype.getAbsoluteDirectiom = function(locationOffset, referenceDirection) {
                /**
                * Returns the relative referenceDirection of a space realtive to my direction
                * takes locationOffset of space ([x, y] relative offset [forward, right])
                * @param {number[]} locationOffset [x, y] offset [forward, right])
                * @returns {string} The direction as ['forward'||'right'||'backward'||'left']
                *
                */

                const offsetForward = locationOffset[0];
                const offsetRight = locationOffset[1];

                let absoluteDirection;
                if (offsetForward > 0 && offsetRight === 0) {
                  absoluteDirection = 'north';
                }
                else if (offsetForward > 0 && offsetRight > 0) {
                  absoluteDirection = 'northeast';
                }
                else if (offsetForward === 0 && offsetRight > 0) {
                  absoluteDirection = 'east';
                }
                else if (offsetForward < 0 && offsetRight > 0) {
                  absoluteDirection = 'southeast';
                }
                else if (offsetForward < 0 && offsetRight === 0) {
                  absoluteDirection = 'south';
                }
                else if (offsetForward < 0 && offsetRight < 0) {
                  absoluteDirection = 'southwest';
                }
                else if (offsetForward === 0 && offsetRight < 0) {
                  absoluteDirection = 'west';
                }
                else if (offsetForward > 0 && offsetRight < 0) {
                  absoluteDirection = 'northwest';
                }

                const allDirections = ['north', 'east', 'south', 'west'];
                const indexOfReferenceDirection = allDirections.indexOf(referenceDirection);
                const indexOfAbsoluteDirection = allDirections.indexOf(absoluteDirection);
                const numberOfDirections = allDirections.length;

                const indexOfRelativeDirections =
                (indexOfAbsoluteDirection + indexOfReferenceDirection + numberOfDirections)
                 % numberOfDirections;
                return allDirections[indexOfRelativeDirections];
              }

              Entity.prototype.getRelativeDirection = function(absoluteDirection, referenceDirection) {
                /**
                * Returns the absolute referenceDirection of a space from its relative referenceDirection
                * @param {number[]} absoluteDirection The absoluteDirection as ['north'||'east'||'south'||'west'];
                * @param {number[]} referenceDirection The referenceDirection as ['forward'||'right'||'backward'||'left']
                * @returns {string} The referenceDirection (relative direction based on our referenceDirection
                *
                */
                let allDirections = ['north', 'east', 'south', 'west'];
                let relativeDirections = ['forward','right','backward','left'];

                const indexOfAbsoluteDirection = allDirections.indexOf(absoluteDirection);
                const indexOfReferenceDirection = allDirections.indexOf(referenceDirection);
                const numberOfDirections = relativeDirections.length

                const indexOfRelativeDirections =
                (indexOfAbsoluteDirection - indexOfReferenceDirection + numberOfDirections)
                 % numberOfDirections;

                return relativeDirections[indexOfRelativeDirections];
              }

              this.space = entitySpace;
              this.location = entitySpace.getLocation();
              this.distance = this.getDistance(this.location);
              this.listenDirection = entityDirection;

              this.absoluteDirection = this.getAbsoluteDirectiom(this.location, referenceDirection);
              this.relativeDirection = this.getRelativeDirection(this.absoluteDirection, referenceDirection);

              let entityProps = this.getEntityType(entitySpace);
              this.type = entityProps[0];
              this.symbol = entityProps[1];
              this.initialHp = entityProps[2];
              this.ticking = entityProps[3];
              this.bound = entityProps[4];

              if (this.isUnit) {
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
