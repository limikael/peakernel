#pragma once
#include <Arduino.h>
#include <map>
#include <memory>
#include <string>
#include "peabind.h"

extern "C" {
	void gpio_loop();
}

namespace peac_gpio {

int digitalRead(int pin);
void digitalWrite(int pin, int value);
void pinMode(int pin, std::string mode);

}

class Pin {
public:
	Pin(int pinNum_) { pinNum=pinNum_; }
	int get() { return peac_gpio::digitalRead(pinNum); }
	void set(int v) { peac_gpio::digitalWrite(pinNum,v); }
	void check() {
		int currentValue=::digitalRead(pinNum);
		if (currentValue!=reportedValue) {
			reportedValue=currentValue;
			change.emit(reportedValue);
		}
	}
	Dispatcher<int> change;

private:
	int pinNum;
	int reportedValue=0;
};

std::shared_ptr<Pin> pin(int pinNum);
