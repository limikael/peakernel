#pragma once
#include <memory>
#include "peabind.h"

class Sys {
public:
	void setup();
	void start();
	void loop();
	VoidPromise awaitBoot();
	void notifyBootComplete();
	void notifyError(std::string err);
	static std::shared_ptr<Sys> getInstance();
	void scheduleRestart(bool normal);
	bool shouldRunUserCode();

private:
    enum RunTarget {
    	NORMAL, SAFE, RESTART_NORMAL, RESTART_SAFE
    };

	RunTarget runTarget=NORMAL;
	VoidPromise bootPromise;
	std::string latchedError;
	bool restartScheduled=false;
};
