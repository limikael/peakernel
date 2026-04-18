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
	Timer::loop();
}

void runtime_stop() {
	clearTimers();
}
