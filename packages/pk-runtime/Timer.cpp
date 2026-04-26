#include <cassert>
#include <algorithm>
#include "Timer.h"
#ifdef ARDUINO
#include <Arduino.h>
#else
static int millis() {
    assert(0 && "millis not implemented");
}
#endif

static int nextTimerId=1;
static std::vector<std::shared_ptr<Timer>> timers;

std::shared_ptr<Timer> createTimeout(int millis_) {
	std::shared_ptr<Timer> t=std::make_shared<Timer>();
	t->id=nextTimerId++;
	t->interval=0;
	t->deadline=millis()+millis_;
	timers.push_back(t);

	return t;
}

std::shared_ptr<Timer> createInterval(int millis_) {
	std::shared_ptr<Timer> t=std::make_shared<Timer>();
	t->id=nextTimerId++;
	t->interval=millis_;
	t->deadline=millis()+millis_;
	timers.push_back(t);

	return t;
}

void clearTimer(int tid) {
    auto it=std::find_if(timers.begin(), timers.end(),
        [&](const std::shared_ptr<Timer>& t) { return t->getId() == tid; });

    if (it==timers.end())
        return;

    timers.erase(it);
}

void clearTimers() {
	timers.clear();
	nextTimerId=1;
}

void Timer::loop() {
	unsigned long now=millis();

    std::vector<std::shared_ptr<Timer>> expired;
    for (auto it=timers.begin(); it!=timers.end();) {
        if (now>=(*it)->deadline) {
            expired.push_back(*it);
            if ((*it)->interval) {
                (*it)->deadline=now+(*it)->interval;
                it++;
            }

            else {
                it=timers.erase(it);
            }
        }

        else {
            it++;
        }
    }

    for (auto &t: expired) {
    	t->timer.emit();
	}
}
