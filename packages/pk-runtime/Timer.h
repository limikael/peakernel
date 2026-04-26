#include <peabind.h>
#include <vector>
#include <memory>

class Timer {
public:
	static void loop();
	int getId() { return id; };
	//static void clearTimers();
	Dispatcher<> timer;


private:
	int id;
	unsigned long deadline;
	unsigned long interval;

	friend std::shared_ptr<Timer> createTimeout(int millis);
	friend std::shared_ptr<Timer> createInterval(int millis);
};

std::shared_ptr<Timer> createTimeout(int millis);
std::shared_ptr<Timer> createInterval(int millis);
void clearTimer(int tid);
void clearTimers();
