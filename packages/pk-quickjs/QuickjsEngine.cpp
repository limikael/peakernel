#include "QuickjsEngine.h"
#include "pk_bindings.h"
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
		record->setInt("liveObjects",pk_bindings_get_num_objects());
		record->setInt("numListeners",pk_bindings_get_num_listeners());
		record->setString("bootError",errorMessage);

		if (errorMessage!="" && !bootComplete)
			record->setString("state","error");

		else if (!running)
			record->setString("state","stopped");

		else if (!bootComplete)
			record->setString("state","booting");

		else
			record->setString("state","running");
	});
#endif
}

void QuickjsEngine::begin() {
	assert(ctx==NULL);
	JSRuntime *rt=JS_NewRuntime();
    ctx=JS_NewContext(rt);
	errorMessage="";
	bootComplete=false;

	pk_bindings_init(ctx);
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
			jsvalFree(bootFn);
			jsvalFree(bootRes);
			return;
		}

		jsvalFree(bootFn);
		jsvalFree(bootRes);
	}
}

void QuickjsEngine::close() {
	assert(ctx!=NULL);
	pk_bindings_exit();
	JSRuntime *rt=JS_GetRuntime(ctx);
    JS_FreeContext(ctx);
    JS_RunGC(rt);
    assert(pk_bindings_get_num_objects()==0);
    JS_FreeRuntime(rt);
	ctx=nullptr;
}

void QuickjsEngine::loop() {
	jsvalQuickjsRunJobs();

	if (jsvalHasException()) {
		errorMessage=jsvalCatchExceptionStdString();
		Serial.printf("Top level: %s\n",errorMessage.c_str());
	}

	if (gcTimer.tick()) {
		jsvalQuickjsRunGc();
	}

	if (warningTimer.tick()) {
		if (errorMessage!="" && !bootComplete) {
#if defined(ARDUINO)
			Serial.printf("%s\n",errorMessage.c_str());
#elif defined(ESP_PLATFORM)
			printf("%s\n",errorMessage.c_str());
#endif
		}
	}
}

void QuickjsEngine::gc() {
	jsvalQuickjsRunGc();
}

void QuickjsEngine::bootResolve() {
	bootComplete=true;
}

void QuickjsEngine::bootReject(std::string message) {
	errorMessage=message;
}

extern "C" void peakernel_restart();

extern const char boot_js[];
QuickjsEngine engine(boot_js);

extern "C" void scheduleRestart(bool run) {
	engine.setRunning(run);
	peakernel_restart();
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

void bootResolve() {
	engine.bootResolve();
}

void bootReject(std::string message) {
	engine.bootReject(message);
}