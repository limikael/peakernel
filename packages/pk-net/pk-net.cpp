#include "pk-net.h"
#include <WiFi.h>

void net_loop() {
	Net::getInstance()->loop();
}