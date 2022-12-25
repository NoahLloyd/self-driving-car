const carCanvas = document.getElementById("carCanvas");
carCanvas.width = AMOUNT_OF_LANES*60;

const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9);

// Initiate player car
const playerCar = createPlayerCar();

const cars = generateCars(AMOUNT_OF_AI_CARS);

let bestCar = cars[0];
if (localStorage.getItem("bestBrain")) {
  for (let i = 0; i < cars.length; i++) {
    cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
    if (i != 0) {
      NeuralNetwork.mutate(cars[i].brain, LEARNING_RATE);
    }
  }
}

const generateTraffic = () => {
  const traffic = [];

  let addedDistance = 200;

  for (let i = 0; i < AMOUNT_OF_TRAFFIC_CARS; i++) {
    const distance = Math.random() * 50;
    addedDistance += distance;

    for (let j = 0;j < Math.floor(AMOUNT_OF_LANES * Math.random()*1); j++) {
      traffic.push(
        new Car(
          road.getLaneCenter(Math.floor(Math.random() * AMOUNT_OF_LANES)),
          (i * 150 + addedDistance) * -1,
          30,
          50,
          "DUMMY",
          2,
          getRandomColor()
        )
      );
    }
  }

  return traffic;
};

const traffic = generateTraffic();

animate();

function save() {
  localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
}

function discard() {
  localStorage.removeItem("bestBrain");
}

function generateCars(N) {
  const cars = [];
  for (let i = 1; i <= N; i++) {
    cars.push(new Car(road.getLaneCenter(Math.floor(AMOUNT_OF_LANES/2)), 100, 30, 50, "AI"));
  }
  return cars;
}

// Create player controlled car
function createPlayerCar() {
  const playerCar = new Car(
    road.getLaneCenter(Math.floor(AMOUNT_OF_LANES/2)),
    -100,
    30,
    50,
    "PLAYER",
    3.1,
    "cyan"
  );

  return playerCar;
}

function animate(time) {
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(road.borders, []);
  }
  for (let i = 0; i < cars.length; i++) {
    cars[i].update(road.borders, traffic);
  }
  bestCar = cars.find((c) => c.y == Math.min(...cars.map((c) => c.y)));

  playerCar.update(road.borders, []);

  carCanvas.height = window.innerHeight;
  networkCanvas.height = window.innerHeight;

  carCtx.save();

  //* Follows the player car
  // Only follows y-value
  if (FOLLOW === "PLAYER_Y")
    carCtx.translate(0, -playerCar.y + carCanvas.height * 0.7);
  // Both y and x
  if (FOLLOW === "PLAYER_XY")
    carCtx.translate(
      -playerCar.x + carCanvas.width * 0.5,
      -playerCar.y + carCanvas.height * 0.7
    );

  //* Follows bestCar (car in front)

  // Only follows y-value
  if (FOLLOW === "BEST_Y")
    carCtx.translate(0, -bestCar.y + carCanvas.height * 0.7);
  // Both y and x
  if (FOLLOW === "BEST_XY")
    carCtx.translate(
      -bestCar.x + carCanvas.width * 0.5,
      -bestCar.y + carCanvas.height * 0.7
    );

  road.draw(carCtx);
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].draw(carCtx, false);
  }
  carCtx.globalAlpha = 0.2;
  for (let i = 0; i < cars.length; i++) {
    cars[i].draw(carCtx, false);
  }
  carCtx.globalAlpha = 1;
  bestCar.draw(carCtx, true);

  playerCar.draw(carCtx, false);

  carCtx.restore();

  networkCtx.lineDashOffset = -time / 50;
  Visualizer.drawNetwork(networkCtx, bestCar.brain);
  requestAnimationFrame(animate);
}
