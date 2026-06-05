#include "pk-net.h"
#include <WiFi.h>

void net_loop() {
	Net::getInstance()->loop();
}

void net_setup() {
	Net::getInstance()->setup();
}