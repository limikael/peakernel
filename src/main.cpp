#include <Arduino.h>
#include "QuickjsEngine.h"

extern const char boot_js[];
extern "C" void peac_notify_setup();
extern "C" void peac_notify_loop();

QuickjsEngine engine(boot_js);

extern "C" void scheduleRestart() {
	engine.scheduleRestart();
}

extern "C" void gc() {
	engine.gc();
}

void setup() {
//	Serial.begin(115200);
	peac_notify_setup();
	engine.setup();
	engine.begin();
}

void loop() {
	engine.loop();
	peac_notify_loop();
}
