#include "pk-gpio.h"

static std::map<int,std::shared_ptr<Pin>> pins;

std::shared_ptr<Pin> pin(int pinNum) {
	if (pins.find(pinNum)==pins.end())
		pins[pinNum]=std::make_shared<Pin>(pinNum);

	return pins[pinNum];
}

int pk_gpio::digitalRead(int pin) {
	return ::digitalRead(pin);
}

void pk_gpio::digitalWrite(int pin, int value) {
	::digitalWrite(pin, value);
}

void pk_gpio::pinMode(int pin, std::string mode) {
	if (mode=="input")
		::pinMode(pin,INPUT);

	if (mode=="input_pullup")
		::pinMode(pin,INPUT_PULLUP);

	else if (mode=="output")
		::pinMode(pin,OUTPUT);

	else {
		Serial.printf("warning! unrecognized pin mode");
	}
}

void gpio_loop() {
	for (const auto& [key, pin]: pins) {
		pin->check();
	}
}
