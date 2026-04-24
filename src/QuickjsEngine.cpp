#include "QuickjsEngine.h"
#include "peac_bindings.h"
#include "jsval-util.h"
#include "Fs.h"
#include "InfoRecord.h"
#include "esp_heap_caps.h"

extern "C" void peac_notify_start();
extern "C" void peac_notify_stop();

QuickjsEngine::QuickjsEngine(const char *boot_)
		:warningTimer(1000), gcTimer(100) {
	boot=boot_;
}

void QuickjsEngine::setup() {
	InfoCollector::getInstance()->collectEvent.on([this](std::shared_ptr<InfoRecord> record) {
		multi_heap_info_t info;
		heap_caps_get_info(&info, MALLOC_CAP_DEFAULT);
		record->setInt("totalHeap",info.total_free_bytes+info.total_allocated_bytes);
		record->setInt("totalUsed",info.total_allocated_bytes);
		record->setInt("totalFree",info.total_free_bytes);
		record->setInt("minimumFreeBytes",info.minimum_free_bytes);
		record->setInt("largestBlock",info.largest_free_block);
		record->setInt("freeBlocks",info.free_blocks);
		record->setInt("openFiles",Fs::getInstance()->getNumOpenFiles());
		record->setInt("liveObjects",peac_bindings_get_num_objects());
		record->setInt("numListeners",peac_bindings_get_num_listeners());

		if (running)
			record->setString("state","running");

		else
			record->setString("state","stopped");
	});
}

void QuickjsEngine::begin() {
	assert(ctx==NULL);
	JSRuntime *rt=JS_NewRuntime();
    ctx=JS_NewContext(rt);
	errorMessage="";

	peac_bindings_init(ctx);
	peac_notify_start();
	JSVAL res=jsvalEval(boot);
	if (jsvalHasException()) {
		errorMessage=jsvalCatchExceptionStdString();
		jsvalFree(res);
		return;
	}

	jsvalFree(res);

	if (running) {
		JSVAL bootFn=jsvalGetProp(jsvalGetGlobal(),"boot");
		JSVAL bootRes=jsvalCall(bootFn,jsvalUndefined(),0,NULL);
		if (jsvalHasException()) {
			errorMessage=jsvalCatchExceptionStdString();
			jsvalFree(bootRes);
			return;
		}

		jsvalFree(bootFn);
		jsvalFree(bootRes);
	}

	multi_heap_info_t info;
	heap_caps_get_info(&info, MALLOC_CAP_DEFAULT);
	//Serial.printf("total used: %d\n",info.total_allocated_bytes);
}

void QuickjsEngine::close() {
	assert(ctx!=NULL);
	//Serial.printf("closing fs...\n");
	Fs::getInstance()->close();
	//Serial.printf("done closing fs...\n");
	assert(Fs::getInstance()->getNumOpenFiles()==0);
	//Serial.printf("running stop funcitons...\n");
	peac_notify_stop();
	//Serial.printf("exit bindings...\n");
	peac_bindings_exit();
	//Serial.printf("bindings exited...\n");
	JSRuntime *rt=JS_GetRuntime(ctx);
    //Serial.printf("freeing context... ****\n");
    JS_FreeContext(ctx);
    JS_RunGC(rt);
    assert(peac_bindings_get_num_objects()==0);
    //Serial.printf("cleanup complete, releasing runtime... ****\n");
    JS_FreeRuntime(rt);
	ctx=nullptr;
}

void QuickjsEngine::loop() {
	jsvalQuickjsRunJobs();
	Fs::getInstance()->tick();

	if (gcTimer.tick()) {
		jsvalQuickjsRunGc();
	}

	if (warningTimer.tick()) {
		//scheduleRestart(false);
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

void QuickjsEngine::scheduleRestart(bool run) {
	running=run;
	restartScheduled=true;
}

void QuickjsEngine::gc() {
	jsvalQuickjsRunGc();
}
