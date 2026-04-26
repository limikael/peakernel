#include "QuickjsEngine.h"
#include "peac_bindings.h"
#include "jsval-util.h"
#include "esp_heap_caps.h"

#ifdef PEAC_INFO
#include "InfoRecord.h"
#endif

QuickjsEngine::QuickjsEngine(const char *boot_)
		:warningTimer(1000), gcTimer(100) {
	boot=boot_;
}

void QuickjsEngine::setup() {
#ifdef PEAC_INFO
	InfoCollector::getInstance()->collectEvent.on([this](std::shared_ptr<InfoRecord> record) {
		multi_heap_info_t info;
		heap_caps_get_info(&info, MALLOC_CAP_DEFAULT);
		record->setInt("totalHeap",info.total_free_bytes+info.total_allocated_bytes);
		record->setInt("totalUsed",info.total_allocated_bytes);
		record->setInt("totalFree",info.total_free_bytes);
		record->setInt("minimumFreeBytes",info.minimum_free_bytes);
		record->setInt("largestBlock",info.largest_free_block);
		record->setInt("freeBlocks",info.free_blocks);
		record->setInt("liveObjects",peac_bindings_get_num_objects());
		record->setInt("numListeners",peac_bindings_get_num_listeners());

		if (running)
			record->setString("state","running");

		else
			record->setString("state","stopped");
	});
#endif
}

void QuickjsEngine::begin() {
	assert(ctx==NULL);
	JSRuntime *rt=JS_NewRuntime();
    ctx=JS_NewContext(rt);
	errorMessage="";

	peac_bindings_init(ctx);
}

void QuickjsEngine::runBootScript() {
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
}

void QuickjsEngine::close() {
	assert(ctx!=NULL);
	peac_bindings_exit();
	JSRuntime *rt=JS_GetRuntime(ctx);
    JS_FreeContext(ctx);
    JS_RunGC(rt);
    assert(peac_bindings_get_num_objects()==0);
    JS_FreeRuntime(rt);
	ctx=nullptr;
}

void QuickjsEngine::loop() {
	jsvalQuickjsRunJobs();

	if (gcTimer.tick()) {
		jsvalQuickjsRunGc();
	}

	if (warningTimer.tick()) {
		if (errorMessage!="")
			Serial.printf("%s\n",errorMessage.c_str());
	}
}

void QuickjsEngine::gc() {
	jsvalQuickjsRunGc();
}

extern "C" void peac_restart();

extern const char boot_js[];
QuickjsEngine engine(boot_js);

extern "C" void scheduleRestart(bool run) {
	engine.setRunning(run);
	peac_restart();
}

extern "C" void gc() {
	engine.gc();
}

extern "C" void quickjs_setup() {
	engine.setup();
}

extern "C" void quickjs_start() {
	engine.begin();
}

extern "C" void quickjs_run_script() {
	engine.runBootScript();
}

extern "C" void quickjs_loop() {
	engine.loop();
}

extern "C" void quickjs_stop() {
	engine.close();
}
