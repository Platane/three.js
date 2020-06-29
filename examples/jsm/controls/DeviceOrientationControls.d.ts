import {
	Camera
} from '../../../src/Three';

export class DeviceOrientationControls {

	constructor( object: Camera, domElement?: HTMLElement );

	object: Camera;
	domElement?: HTMLElement

	// API

	alphaOffset: number;
	deviceOrientation: any;
	enabled: boolean;
	screenOrientation: number;
	offsetRotateEnabled: boolean;
	offsetRotateSpeed: number;
	offsetRotatePhi :number;
	offsetRotateTheta :number;
	minPolarAngle :number;
	maxPolarAngle :number;

	connect(): void;
	disconnect(): void;
	dispose(): void;
	update(): void;

}
