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
	void notifySettingsChange() { settingsChangeEvent.emit(); }
	static std::shared_ptr<Sys> getInstance();
	void scheduleRestart(bool normal);
	bool shouldRunUserCode();
	bool isBootComplete();
	std::string getLatchedError();
	void dismissError();

	Dispatcher<> bootCompleteEvent;
	Dispatcher<> latchedErrorChangeEvent;
	Dispatcher<> settingsChangeEvent;

private:
    enum RunTarget {
    	NORMAL, SAFE, RESTART_NORMAL, RESTART_SAFE
    };

	RunTarget runTarget=NORMAL;
	VoidPromise bootPromise;
	std::string latchedError;
	bool restartScheduled=false;
};
