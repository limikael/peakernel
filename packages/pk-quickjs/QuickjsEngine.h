#include "SoftTimer.h"
#include <string>

extern "C" {
#include "quickjs.h"
void gc();
//void scheduleRestart(bool run);
/*void bootResolve();
void bootReject(std::string message);*/
}

class QuickjsEngine {
public:
	QuickjsEngine(const char *boot_);
	void setup();
	void begin();
	void close();
	void loop();
	//void setRunning(bool running_) { running=running_; }
	void runBootScript();
	void gc();
	/*void bootResolve();
	void bootReject(std::string message);*/

private:
	//bool running=true;/*,bootComplete=false;*/
	//std::string errorMessage;
	//SoftTimer warningTimer;
	SoftTimer gcTimer;
	JSContext *ctx=nullptr;
	const char *boot;
};
