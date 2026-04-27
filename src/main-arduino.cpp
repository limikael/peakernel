#include <Arduino.h>
#include "peakernel.h"
#include "esp_heap_caps.h"

void setup() {
    Serial.begin(112500);
	peakernel_setup();
}

void loop() {
	/*multi_heap_info_t info;
	heap_caps_get_info(&info, MALLOC_CAP_DEFAULT);
	delay(100);
	Serial.printf("used: %d\n",info.total_allocated_bytes);*/

	peakernel_loop();
}
