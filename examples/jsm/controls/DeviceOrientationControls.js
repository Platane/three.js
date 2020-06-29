/**
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 *
 * W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */

import {
	Euler,
	MathUtils,
	Quaternion,
	Vector3,
	Vector2
} from "../../../build/three.module.js";

var DeviceOrientationControls = function ( object, domElement ) {

	if ( domElement === document ) console.error( 'THREE.DeviceOrientationControls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.' );

	var scope = this;

	this.domElement = domElement;
	this.object = object;
	this.object.rotation.reorder( 'YXZ' );

	this.enabled = true;

	this.offsetRotateEnabled = false;
	this.offsetRotateSpeed = 0.5;

	// To provide a good experience in desktop ( where device orientation event is not fired )
	// default to "portrait mode"
	this.deviceOrientation = { alpha: 0, beta: 90, gamma: 0 };
	this.screenOrientation = 0;

	this.alphaOffset = 0; // radians

	// When rotateSpeed is enabled, hold offset spherical values to apply
	this.offsetRotatePhi = 0; // radians
	this.offsetRotateTheta = 0; // radians

	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	this.minPolarAngle = - Math.PI / 2; // radians
	this.maxPolarAngle = Math.PI / 2; // radians

	var lastPointerPosition = new Vector2();

	var onDeviceOrientationChangeEvent = function ( event ) {

		if ( event.alpha !== null && event.beta !== null && event.gamma !== null ) {

			this.deviceOrientation.alpha = event.alpha;
			this.deviceOrientation.beta = event.beta;
			this.deviceOrientation.gamma = event.gamma;

		}

	};

	var onScreenOrientationChangeEvent = function () {

		scope.screenOrientation = window.orientation || 0;

	};

	var onContextMenu = function ( event ) {

		event.preventDefault();

	};

	var onMouseDown = function ( event ) {

		event.preventDefault();

		// Manually set the focus since calling preventDefault above
		// prevents the browser from setting it automatically.
		if ( event.currentTarget.focus ) event.currentTarget.focus();
		else window.focus();

		startOffsetRotate( event.clientX, event.clientY );

		document.addEventListener( "mousemove", onMouseMove, false );
		document.addEventListener( "mouseup", onMouseUp, false );

	};

	var onMouseMove = function ( event ) {

		moveOffsetRotate( event.clientX, event.clientY );

	};

	var onMouseUp = function () {

		document.removeEventListener( "mousemove", onMouseMove, false );
		document.removeEventListener( "mouseup", onMouseUp, false );

	};

	var onTouchStart = function ( event ) {

		if ( event.touches.length > 0 ) {

			startOffsetRotate( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		}

		scope.update();

	};

	var onTouchMove = function ( event ) {

		moveOffsetRotate( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

	};

	var onTouchEnd = function ( event ) {

		if ( event.touches.length > 0 ) {

			startOffsetRotate( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		}

	};

	var startOffsetRotate = function ( x, y ) {

		lastPointerPosition.set( x, y );

	};

	var moveOffsetRotate = function ( x, y ) {

		if ( ! scope.offsetRotateEnabled ) return;

		var element = scope.domElement;

		var dx = ( ( x - lastPointerPosition.x ) / element.clientHeight ) * scope.rotateSpeed;
		var dy = ( ( y - lastPointerPosition.y ) / element.clientHeight ) * scope.rotateSpeed;

		lastPointerPosition.set( x, y );

		scope.offsetRotatePhi += dx * Math.PI * 2;
		scope.offsetRotateTheta += - dy * Math.PI * 2;

		scope.offsetRotateTheta = MathUtils.clamp( scope.offsetRotateTheta, scope.minPolarAngle, scope.maxPolarAngle );

		scope.update();

	};

	// The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

	var setObjectQuaternion = function () {

		var zee = new Vector3( 0, 0, 1 );

		var y = new Vector3( 0, 1, 0 );

		var euler = new Euler();

		var q0 = new Quaternion();

		var q1 = new Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis

		return function ( quaternion, alpha, beta, gamma, orient, offsetRotatePhi, offsetRotateTheta ) {

			euler.set( beta, alpha + offsetRotatePhi, - gamma, 'YXZ' ); // 'ZXY' for the device, but 'YXZ' for us

			quaternion.setFromEuler( euler ); // orient the device

			quaternion.multiply( q1 ); // camera looks out the back of the device, not the top

			// add theta offset
			if ( orient === 0 ) {

				y.set( 1, 0, 0 );
				q0.setFromAxisAngle( y, - offsetRotateTheta );

			} else if ( orient === 180 ) {

				y.set( 1, 0, 0 );
				q0.setFromAxisAngle( y, offsetRotateTheta );

			} else if ( orient === 90 ) {

				y.set( 0, 1, 0 );
				q0.setFromAxisAngle( y, offsetRotateTheta );

			} else if ( orient === - 90 ) {

				y.set( 0, 1, 0 );
				q0.setFromAxisAngle( y, - offsetRotateTheta );

			}

			quaternion.multiply( q0 );

			quaternion.multiply( q0.setFromAxisAngle( zee, - orient ) ); // adjust for screen orientation

		};

	}();

	this.connect = function () {

		onScreenOrientationChangeEvent(); // run once on load

		// iOS 13+

		if ( window.DeviceOrientationEvent !== undefined && typeof window.DeviceOrientationEvent.requestPermission === 'function' ) {

			window.DeviceOrientationEvent.requestPermission().then( function ( response ) {

				if ( response == 'granted' ) {

					window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
					window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

				}

			} ).catch( function ( error ) {

				console.error( 'THREE.DeviceOrientationControls: Unable to use DeviceOrientation API:', error );

			} );

		} else {

			window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
			window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

		}

		if ( domElement ) {

			domElement.addEventListener( "contextmenu", onContextMenu, false );
			domElement.addEventListener( "mousedown", onMouseDown, false );
			domElement.addEventListener( "touchstart", onTouchStart, false );
			domElement.addEventListener( "touchend", onTouchEnd, false );
			domElement.addEventListener( "touchmove", onTouchMove, false );

		}

		scope.enabled = true;

	};

	this.disconnect = function () {

		window.removeEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
		window.removeEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

		if ( domElement ) {

			domElement.removeEventListener( "contextmenu", onContextMenu, false );
			domElement.removeEventListener( "mousedown", onMouseDown, false );
			domElement.removeEventListener( "touchstart", onTouchStart, false );
			domElement.removeEventListener( "touchend", onTouchEnd, false );
			domElement.removeEventListener( "touchmove", onTouchMove, false );

		}

		document.removeEventListener( "mousemove", onMouseMove, false );
		document.removeEventListener( "mouseup", onMouseUp, false );

		scope.enabled = false;

	};

	this.update = function () {

		if ( scope.enabled === false ) return;

		var alpha = MathUtils.degToRad( scope.deviceOrientation.alpha ) + scope.alphaOffset; // Z

		var beta = MathUtils.degToRad( scope.deviceOrientation.beta ); // X'

		var gamma = MathUtils.degToRad( scope.deviceOrientation.gamma ); // Y''

		var orient = MathUtils.degToRad( scope.screenOrientation ); // O

		setObjectQuaternion( scope.object.quaternion, alpha, beta, gamma, orient, scope.offsetRotatePhi, scope.offsetRotateTheta );

	};

	this.dispose = function () {

		scope.disconnect();

	};

	this.connect();

};

export { DeviceOrientationControls };
