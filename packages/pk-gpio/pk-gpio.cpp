#include "pk-gpio.h"

static std::map<int,std::shared_ptr<Pin>> pins;

std::shared_ptr<Pin> pin(int pinNum) {
	if (pins.find(pinNum)==pins.end())
		pins[pinNum]=std::make_shared<Pin>(pinNum);

	return pins[pinNum];
}

Pin::Pin(int pinNum_) {
	pinNum=pinNum_;
}

int Pin::get() {
	if (mode=="output")
		return reportedValue;

#if defined(ARDUINO)
	return ::digitalRead(pinNum);
#elif defined(ESP_PLATFORM)
	return gpio_get_level((gpio_num_t)pinNum);
#endif
}

void Pin::set(int value) {
	reportedValue=value;
#if defined(ARDUINO)
	::digitalWrite(pinNum,value);
#elif defined(ESP_PLATFORM)
	gpio_set_level((gpio_num_t)pinNum,value);
#endif
}

void Pin::check() {
	int currentValue=get();
	if (currentValue!=reportedValue) {
		reportedValue=currentValue;
		change.emit(reportedValue);
	}
}

void Pin::setMode(std::string mode_) {
	mode=mode_;

#if defined(ARDUINO)
	if (mode=="output")
		pinMode(pinNum,OUTPUT);

	else if (mode=="input")
		pinMode(pinNum,INPUT);

	else if (mode=="input_pullup")
		pinMode(pinNum,INPUT_PULLUP);

	else
		Serial.printf("unknown pin mode");

#elif defined(ESP_PLATFORM)
	if (mode=="output")
	    gpio_set_direction((gpio_num_t)pinNum, GPIO_MODE_OUTPUT);

	else if (mode=="input")
	    gpio_set_direction((gpio_num_t)pinNum, GPIO_MODE_INPUT);

	else
		printf("unknown pin mode");
#endif
}

int pk_gpio::digitalRead(int pinNum) {
	return pin(pinNum)->get();
}

void pk_gpio::digitalWrite(int pinNum, int value) {
	pin(pinNum)->set(value);
}

void pk_gpio::pinMode(int pinNum, std::string mode) {
	pin(pinNum)->setMode(mode);
}

void gpio_loop() {
	for (const auto& [key, pin]: pins) {
		pin->check();
	}
}
