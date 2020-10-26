const root = document.documentElement;

const raster = 48; //px
const floorHeight = 4;

let nextFloor = 0;
let prevFloor = nextFloor;

let currentPos = 2 * raster;
let targetPos = currentPos;

let animationId;

const floorTemplate = `
<div class="floor">
    <div class="wall">
        <button class="call down">🔽</button>
        <div class="doors"></div>
        <button class="call up">🔼</button>
    </div>
</div>
`;

const controlTemplate = (floor: number) => `
<button>${floor}</button>
`;

export interface Building {
  floors: Floor[];
  elevator: {
    element: () => HTMLElement;
    currentFloor: number;
  };
  controls: () => HTMLElement[];
}

export interface Floor {
  callUp: () => HTMLElement;
  callDown: () => HTMLElement;
  door: {
    element: () => HTMLElement;
    isClosed: boolean;
  };
}

export interface ElevatorEvent {
  target: 'door' | 'externalButton' | 'elevator' | 'internalButton';
  floor: number;
  type?: 'up' | 'down' | 'open' | 'close' | 'stop' | 'approach';
}

export const buildingModel: Building = {
  floors: [],
  elevator: {
    element: () => document.querySelector('.elevator'),
    currentFloor: nextFloor,
  },
  controls: () => Array.from(document.querySelectorAll('.controls button')),
};

export function build(
  numberOfFloors: number,
  ...callbacks: (($event: ElevatorEvent) => any)[]
) {
  createFloors(numberOfFloors);
  initBuildingModel();
  createControls(buildingModel);
  if (callbacks && callbacks.length > 0) {
    callbacks.forEach((callback) => initCallbacks(callback));
  }
}

export function moveTo(floor: number) {
  if (floor !== prevFloor) {
    const pos =
      (floor + 1) * 2 * raster + floor * 2 * floorHeight * raster - floor * 5;
    targetPos = pos;
    cancelAnimation();
    animationId = requestAnimationFrame(animationLoop);
    prevFloor = floor;
    nextFloor = floor;
  }
}

export function operateDoor(floor: number, dir: 'open' | 'close') {
  const openClass = 'open';
  const door = buildingModel.floors[floor].door;
  if (dir === 'open') {
    door.element().classList.add(openClass);
  } else {
    door.element().classList.remove(openClass);
  }
}

function createFloors(numberOfFloors: number) {
  const building = document.querySelector('#building');
  if (numberOfFloors > 1) {
    building.innerHTML =
      floorTemplate.repeat(numberOfFloors - 1) + building.innerHTML;
  }
  const topFloor = building.querySelector('.floor:first-of-type');
  (topFloor.querySelector('.up') as HTMLElement).style.visibility = 'hidden';
}

function createControls(building: Building) {
  const controls = building.elevator
    .element()
    .querySelector('.elevator .controls');
  building.floors.forEach(
    (_, i) => (controls.innerHTML = controlTemplate(i) + controls.innerHTML)
  );
}

function initBuildingModel(): void {
  const floors = document.querySelectorAll('.floor');
  floors.forEach((floor) =>
    buildingModel.floors.push({
      callDown: () => floor.querySelector('.down'),
      callUp: () => floor.querySelector('.up'),
      door: { element: () => floor.querySelector('.doors'), isClosed: true },
    })
  );
  buildingModel.floors.reverse();
}

function initCallbacks(callback: ($event: ElevatorEvent) => any) {
  buildingModel.floors.forEach((floor, i) => {
    floor
      .callDown()
      .addEventListener('click', () =>
        callback({ target: 'externalButton', floor: i, type: 'down' })
      );
    floor
      .callUp()
      .addEventListener('click', () =>
        callback({ target: 'externalButton', floor: i, type: 'up' })
      );
    floor.door.element().addEventListener('transitionend', (ev) => {
      if (ev.pseudoElement === '::after') {
        if (!floor.door.element().classList.contains('open')) {
          floor.door.isClosed = true;
          callback({ target: 'door', floor: i, type: 'close' });
        } else {
          floor.door.isClosed = false;
          callback({ target: 'door', floor: i, type: 'open' });
        }
      }
    });
  });
  const elevator = buildingModel.elevator;
  elevator.element().addEventListener('approach', () =>
    callback({
      target: 'elevator',
      floor: elevator.currentFloor,
      type: 'approach',
    })
  );
  elevator
    .element()
    .addEventListener('stop', () =>
      callback({ target: 'elevator', floor: nextFloor, type: 'stop' })
    );
  buildingModel
    .controls()
    .forEach((control, i, controls) =>
      control.addEventListener('click', () =>
        callback({ target: 'internalButton', floor: controls.length - 1 - i })
      )
    );
}

function checkFloorIntersections() {
  const floors = Array.from(document.querySelectorAll('.floor')).reverse();
  const elevator = buildingModel.elevator;
  const elevatorRect = elevator.element().getBoundingClientRect();
  floors.forEach((floor, i) => {
    const wallRect = floor.querySelector('.wall').getBoundingClientRect();
    if (intersectRect(wallRect, elevatorRect) && elevator.currentFloor !== i) {
      elevator.currentFloor = i;
      elevator.element().dispatchEvent(new Event('approach'));
    }
  });
}

function animationLoop() {
  const distance = Math.abs(targetPos - currentPos);
  if (distance > 0.2) {
    let dir: 1 | -1 = 1;
    if (targetPos < currentPos) {
      dir = -1;
    }
    const velocity = distance < raster ? distance / 12 : 5;
    setElevatorPos(currentPos + dir * velocity);
    animationId = requestAnimationFrame(animationLoop);
    checkFloorIntersections();
  } else if (animationId) {
    stopElevator();
  }
}

function setElevatorPos(position: number) {
  currentPos = position;
  root.style.setProperty('--elevator-pos', `${currentPos}px`);
}

function stopElevator() {
  currentPos = targetPos;
  setElevatorPos(currentPos);
  buildingModel.elevator.element().dispatchEvent(new Event('stop'));
  cancelAnimation();
}

function cancelAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = undefined;
  }
}

function intersectRect(rectA: DOMRect, rectB: DOMRect): boolean {
  return !(
    rectB.left >= rectA.right ||
    rectB.right <= rectA.left ||
    rectB.top >= rectA.bottom ||
    rectB.bottom <= rectA.top
  );
}
