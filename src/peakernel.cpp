#include "peakernel.h"

static bool restartScheduled=false;
void peakernel_restart() {
	restartScheduled=true;
}

void peakernel_setup() {
	peakernel_notify_setup();
	peakernel_notify_start();
}

void peakernel_loop() {
	if (restartScheduled) {
		restartScheduled=false;
		peakernel_notify_stop();
		peakernel_notify_start();
	}

	peakernel_notify_loop();
}
