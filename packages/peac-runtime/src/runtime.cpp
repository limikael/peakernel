#include <Arduino.h>
#include "runtime.h"
#include "Timer.h"
#include "Fs.h"
#include "SoftTimer.h"
#include <cassert>

void digitalToggle(int pin) {
	pinMode(8,OUTPUT);
	digitalWrite(pin,!digitalRead(pin));
}

void msleep(int millis) {
	delay(millis);
}

void runtime_setup() {
	pinMode(8,OUTPUT);
}

void runtime_start() {
	pinMode(8,OUTPUT);
}

void runtime_loop() {
	/*if (softTimer.tick()) {
		Serial.printf("ticking here...\n");
	}*/
	Timer::loop();
}

void runtime_stop() {
	//Timer::clearTimers();
}
