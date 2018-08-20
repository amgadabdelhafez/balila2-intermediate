## Balila2 - intermediate - level 9

### _Never before have you seen a room so full of sludge. Start the fireworks!_

> **TIP:** Be careful not to let the ticking captive get caught in the flames. Use `warrior.distanceOf()` to avoid the captives.

> **CLUE:** Be sure to bind the surrounding enemies before fighting. Check your health before detonating explosives.

### Floor Map

```
╔════╗
║ssC>║
║@sss║
║ssC ║
╚════╝

s = Sludge (12 HP)
C = Captive (1 HP)
> = stairs
@ = Balila2 (20 HP)
```

### Abilities

#### Actions (only one per turn)

* `warrior.walk()`: Move one space in the given direction (forward by default).
* `warrior.attack()`: Attack a unit in the given direction (forward by default) dealing 5 HP of damage.
* `warrior.rest()`: Gain 10% of max health back, but do nothing more.
* `warrior.bind()`: Bind a unit in the given direction (forward by default) to keep him from moving.
* `warrior.rescue()`: Release a unit from his chains in the given direction (forward by default).
* `warrior.detonate()`: Detonate a bomb in a given direction (forward by default) dealing 8 HP of damage to that space and 4 HP of damage to surrounding 4 spaces (including yourself).

#### Senses

* `warrior.distanceOf()`: Return an integer representing the distance to the given space.
* `warrior.directionOfStairs()`: Return the direction (forward, right, backward or left) the stairs are from your location.
* `warrior.think()`: Think about your options before choosing an action (`console.log` replacement).
* `warrior.feel()`: Return the adjacent space in the given direction (forward by default).
* `warrior.health()`: Return an integer representing your health.
* `warrior.directionOf()`: Return the direction (forward, right, backward or left) to the given space.
* `warrior.listen()`: Return an array of all spaces which have units in them (excluding yourself).
* `warrior.look()`: Returns an array of up to 3 spaces in the given direction (forward by default).

### Next Steps

When you're done editing `Player.js`, run the `warriorjs` command again.
