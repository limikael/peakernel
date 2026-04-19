#include "SoftTimer.h"

extern "C" {
#include "quickjs.h"
void scheduleRestart();
}

class QuickjsEngine {
public:
	QuickjsEngine(const char *boot_);
	void setup();
	void begin();
	void close();
	void loop();
	void scheduleRestart();

private:
	std::string errorMessage;
	SoftTimer warningTimer;
	JSContext *ctx=nullptr;
	bool restartScheduled=false;
	const char *boot;
};
