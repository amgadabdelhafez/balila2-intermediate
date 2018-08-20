
function getRelativeDirection(direction, bearing) {
  allDirections = ['north', 'east', 'south', 'west'];
  allBearings = ['forward','right','backward','left'];

  const indexOfDirection = allDirections.indexOf(direction);
  const indexOfBearing = allDirections.indexOf(bearing);
  const total = allBearings.length

  const index = (indexOfDirection - indexOfBearing + total) % total;

  return allBearings[index];
  }

t = 'north';
r = 'forward'
result = getRelativeDirection(t,t)
console.log(`${t} should be ${r}: ${result}`);
