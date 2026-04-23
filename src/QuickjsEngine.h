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
	void scheduleRestart(bool running);
	void gc();

private:
	bool running=true;
	std::string errorMessage;
	SoftTimer warningTimer;
	SoftTimer gcTimer;
	JSContext *ctx=nullptr;
	bool restartScheduled=false;
	const char *boot;
};
