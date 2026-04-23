#include "SoftTimer.h"

extern "C" {
#include "quickjs.h"
void scheduleRestart();
void gc();
}

class QuickjsEngine {
public:
	QuickjsEngine(const char *boot_);
	void setup();
	void begin();
	void close();
	void loop();
	void scheduleRestart();
	void gc();

private:
	std::string errorMessage;
	SoftTimer warningTimer;
	SoftTimer gcTimer;
	JSContext *ctx=nullptr;
	bool restartScheduled=false;
	const char *boot;
};
