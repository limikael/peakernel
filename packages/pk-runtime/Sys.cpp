#include "Sys.h"
#include <Arduino.h>
#include "peakernel.h"
#include "esp_heap_caps.h"

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
		UBaseType_t hw = uxTaskGetStackHighWaterMark(NULL);
		multi_heap_info_t info;
		heap_caps_get_info(&info, MALLOC_CAP_DEFAULT);
		record->setInt("totalHeap",info.total_free_bytes+info.total_allocated_bytes);
		record->setInt("totalUsed",info.total_allocated_bytes);
		record->setInt("totalFree",info.total_free_bytes);
		record->setInt("minFreeBytes",info.minimum_free_bytes);
		record->setInt("minStackWords",hw);
		record->setInt("largestBlock",info.largest_free_block);
		record->setInt("freeBlocks",info.free_blocks);

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
	if (bootPromise.isSettled())
		return;

	bootPromise.resolve();
	bootCompleteEvent.emit();
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

bool Sys::isBootComplete() {
	return bootPromise.isResolved();
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