#include "SoftTimer.h"

extern "C" {
#include "quickjs.h"
void scheduleRestart(bool run);
void gc();
}

class QuickjsEngine {
public:
	QuickjsEngine(const char *boot_);
	void setup();
	void begin();
	void close();
	void loop();
	void setRunning(bool running_) { running=running_; }
	void runBootScript();
	void gc();

private:
	bool running=true;
	std::string errorMessage;
	SoftTimer warningTimer;
	SoftTimer gcTimer;
	JSContext *ctx=nullptr;
	const char *boot;
};
