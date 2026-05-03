#include <Arduino.h>
#include "peakernel.h"
#include "esp_heap_caps.h"

void myTask(void *arg) {
    peakernel_setup();
    for (;;) {
        taskYIELD();
		peakernel_loop();
	}
}

void setup() {
    Serial.begin(112500);
	xTaskCreatePinnedToCore(
        myTask,
        "myTask",
        16384,
        nullptr,
        1,
        nullptr,
        ARDUINO_RUNNING_CORE
    );
}

void loop() {
	//peakernel_loop();
}
