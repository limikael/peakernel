#include "QuickjsEngine.h"
#include "pk_bindings.h"
#include "jsval-util.h"
#include "esp_heap_caps.h"
#include "Sys.h"

#ifdef PEAC_INFO
#include "InfoRecord.h"
#endif

QuickjsEngine::QuickjsEngine(const char *boot_)
		: gcTimer(100) {
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
	});
#endif
}

void QuickjsEngine::begin() {
	assert(ctx==NULL);
	JSRuntime *rt=JS_NewRuntime();
    ctx=JS_NewContext(rt);
	pk_bindings_init(ctx);
}

void QuickjsEngine::runBootScript() {
	JSVAL res=jsvalEval(boot);
	if (jsvalHasException()) {
		Sys::getInstance()->notifyError(jsvalCatchExceptionStdString());
		jsvalFree(res);
		return;
	}

	jsvalFree(res);
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
		std::string e=jsvalCatchExceptionStdString();
		Sys::getInstance()->notifyError(e);
	}

	if (gcTimer.tick()) {
		jsvalQuickjsRunGc();
	}
}

void QuickjsEngine::gc() {
	jsvalQuickjsRunGc();
}

extern const char boot_js[];
QuickjsEngine engine(boot_js);

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
