#include "Sys.h"
#include <Arduino.h>
#include "peakernel.h"

#ifdef PEAKERNEL_INFO
#include "InfoRecord.h"
#endif

std::shared_ptr<Sys> Sys::getInstance() {
	static std::shared_ptr<Sys> instance=nullptr;

	if (instance==nullptr)
		instance=std::shared_ptr<Sys>(new Sys());

	return instance;
}

void Sys::setup() {
#ifdef PEAKERNEL_INFO
	InfoCollector::getInstance()->collectEvent.on([this](std::shared_ptr<InfoRecord> record) {
		record->setString("error",latchedError);

		if (bootPromise.isRejected())
			record->setString("state","error");

		else if (!bootPromise.isSettled())
			record->setString("state","booting");

		else if (runTarget==SAFE)
			record->setString("state","stopped");

		else
			record->setString("state","running");
	});
#endif
}

void Sys::start() {
	latchedError="";
	//Serial.printf("Sys starting...\n");
	bootPromise=VoidPromise();
}

VoidPromise Sys::awaitBoot() {
	return bootPromise;
}

void Sys::notifyBootComplete() {
	bootPromise.resolve();
}

void Sys::notifyError(std::string err) {
	latchedError=err;
	if (!bootPromise.isSettled()) {
		Serial.printf("BootErr: %s\n",err.c_str());
		bootPromise.reject(err);
	}

	else {
		Serial.printf("Err: %s\n",err.c_str());
	}
}

bool Sys::shouldRunUserCode() {
	return (runTarget==NORMAL);
}

void Sys::loop() {
	if (runTarget==RESTART_NORMAL) {
		runTarget=NORMAL;
		peakernel_notify_stop();
		peakernel_notify_start();
	}

	else if (runTarget==RESTART_SAFE) {
		runTarget=SAFE;
		peakernel_notify_stop();
		peakernel_notify_start();
	}
}

void Sys::scheduleRestart(bool normal) {
	runTarget=(normal?RESTART_NORMAL:RESTART_SAFE);
}