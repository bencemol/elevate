import { buildingModel, ElevatorEvent, moveTo, operateDoor } from './init';

export class Controller {
  private prevFloor = 0;

  private callQueue: number[] = [];

  private logger($event: ElevatorEvent) {
    console.log($event);
  }

  private moveElevator = ($event: ElevatorEvent) => {
    if (buildingModel.floors[this.prevFloor].door.isClosed) {
      if (this.callQueue.length > 0) {
        moveTo(this.callQueue[0]);
      }
    }
  };

  private openDoor = ($event: ElevatorEvent) => {
    if ($event.target === 'elevator') {
      operateDoor($event.floor, 'open');
      this.prevFloor = this.callQueue.shift();
      setTimeout(() => operateDoor($event.floor, 'close'), 2000);
    }
  };

  private callElevator = ($event: ElevatorEvent) => {
    if (
      $event.target === 'externalButton' ||
      $event.target === 'internalButton'
    ) {
      const { floor } = $event;
      if (floor === this.prevFloor && this.callQueue.length === 0) {
        operateDoor(floor, 'open');
        setTimeout(() => operateDoor(floor, 'close'), 2000);
        return;
      }
      if (floor === this.callQueue[this.callQueue.length - 1]) {
        return;
      }
      if (
        (floor > this.prevFloor && floor < this.callQueue[0]) ||
        (floor < this.prevFloor && floor > this.callQueue[0])
      ) {
        this.callQueue.unshift(floor);
      } else {
        this.callQueue.push(floor);
      }
      console.log(`queue: ${this.callQueue}`);
    }
  };

  callbacks = [
    this.logger,
    this.callElevator,
    this.moveElevator,
    this.openDoor,
  ];
}
