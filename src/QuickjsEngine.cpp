#include "QuickjsEngine.h"
#include "peac_bindings.h"
#include "jsval-util.h"
#include "Fs.h"
#include "InfoRecord.h"

extern "C" void peac_notify_start();
extern "C" void peac_notify_stop();

QuickjsEngine::QuickjsEngine(const char *boot_)
		:warningTimer(1000) {
	boot=boot_;
}

void QuickjsEngine::setup() {
	getInfoCollector()->collect.on([](std::shared_ptr<InfoRecord> info) {
		info->setInt("numOpenFiles",Fs::getInstance()->getNumOpenFiles());
	});
}

void QuickjsEngine::begin() {
	//pinMode(4,INPUT_PULLUP);
	//Serial.printf("***** starting...\n");

	assert(ctx==NULL);
	JSRuntime *rt=JS_NewRuntime();
    ctx=JS_NewContext(rt);
	errorMessage="";

	peac_bindings_init(ctx);
	peac_notify_start();
	JSVAL res=jsvalEval(boot);
	if (jsvalHasException())
		errorMessage=jsvalCatchExceptionStdString();

	jsvalFree(res);
}

void QuickjsEngine::close() {
	assert(ctx!=NULL);
	Fs::getInstance()->close();
	assert(Fs::getInstance()->getNumOpenFiles()==0);
	peac_notify_stop();
	peac_bindings_exit();
	JSRuntime *rt=JS_GetRuntime(ctx);
    JS_FreeContext(ctx);
    JS_RunGC(rt);
    assert(peac_bindings_get_num_objects()==0);
    JS_FreeRuntime(rt);
	ctx=nullptr;
}

void QuickjsEngine::loop() {
	Fs::getInstance()->tick();

	if (warningTimer.tick()) {
		//Serial.printf("pin 4: %d\n",digitalRead(4));
		/*if (!digitalRead(4))
			scheduleRestart();*/

		if (errorMessage!="")
			Serial.printf("%s\n",errorMessage.c_str());
	}

	if (restartScheduled) {
		restartScheduled=false;
		close();
		begin();
	}
}

void QuickjsEngine::scheduleRestart() {
	restartScheduled=true;
}