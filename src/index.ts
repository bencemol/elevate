import { build } from './init';
import { Controller } from './controller';

const NUMBER_OF_FLOORS = 4;

const controller = new Controller();

build(NUMBER_OF_FLOORS, ...controller.callbacks);
