#include "peac.h"

static bool restartScheduled=false;
void peac_restart() {
	restartScheduled=true;
}

void peac_setup() {
	peac_notify_setup();
	peac_notify_start();
}

void peac_loop() {
	if (restartScheduled) {
		restartScheduled=false;
		peac_notify_stop();
		peac_notify_start();
	}

	peac_notify_loop();
}
