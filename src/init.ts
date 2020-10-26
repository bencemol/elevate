const raster = 48; //px
const floorHeight = 4;
let nextFloor = 0;
let prevFloor = 0;

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
  elevator: () => HTMLElement;
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
  direction?: 'up' | 'down' | 'open' | 'close';
}

export const buildingModel: Building = {
  floors: [],
  elevator: () => document.querySelector('.elevator'),
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
    const root = document.documentElement;
    const elevatorPos =
      (floor + 1) * 2 * raster + floor * 2 * floorHeight * raster - floor * 5;
    root.style.setProperty('--elevator-pos', `${elevatorPos}px`);
    prevFloor = nextFloor;
    nextFloor = floor;
    root.style.setProperty(
      '--elevator-delay',
      Math.abs(prevFloor - nextFloor).toString()
    );
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
  const controls = building.elevator().querySelector('.elevator .controls');
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
        callback({ target: 'externalButton', floor: i, direction: 'down' })
      );
    floor
      .callUp()
      .addEventListener('click', () =>
        callback({ target: 'externalButton', floor: i, direction: 'up' })
      );
    floor.door.element().addEventListener('transitionend', (ev) => {
      if (ev.pseudoElement === '::after') {
        if (!floor.door.element().classList.contains('open')) {
          floor.door.isClosed = true;
          callback({ target: 'door', floor: i, direction: 'close' });
        } else {
          floor.door.isClosed = false;
          callback({ target: 'door', floor: i, direction: 'open' });
        }
      }
    });
  });
  buildingModel
    .elevator()
    .addEventListener('transitionend', () =>
      callback({ target: 'elevator', floor: nextFloor })
    );
  buildingModel
    .controls()
    .forEach((control, i, controls) =>
      control.addEventListener('click', () =>
        callback({ target: 'internalButton', floor: controls.length - 1 - i })
      )
    );
}
