#pragma once
#if defined(ARDUINO)
#include <Arduino.h>
#elif defined(ESP_PLATFORM)
#include "driver/gpio.h"
#endif
#include <map>
#include <memory>
#include <string>
#include "peabind.h"

extern "C" {
	void gpio_loop();
}

namespace pk_gpio {

int digitalRead(int pin);
void digitalWrite(int pin, int value);
void pinMode(int pin, std::string mode);

}

class Pin {
public:
	Pin(int pinNum_);
	int get();
	void set(int v);
	void check();
	void setMode(std::string mode);
	Dispatcher<int> change;

private:
	int pinNum;
	int reportedValue=0;
	std::string mode;
};

std::shared_ptr<Pin> pin(int pinNum);
