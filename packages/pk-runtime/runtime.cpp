#include <Arduino.h>
#include "runtime.h"
#include "Timer.h"
#include "Fs.h"
#include "SoftTimer.h"
#include <cassert>
#include "encoding.h"

void runtime_setup() {
    Fs::getInstance()->openEvent.on([](std::shared_ptr<OpenEvent> ev) {
        if (ev->getMode()!="r" || ev->getPathname()!="/hello")
            return;

        auto f=ev->accept();
        if (!f)
            return;

        f->drainEvent.on([f](){
	        f->write(encodeAscii("hello world"));
	        f->close();
        });
    });

    Fs::getInstance()->openEvent.on([](std::shared_ptr<OpenEvent> ev) {
        if (ev->getMode()!="r" || ev->getPathname()!="/hello2")
            return;

        auto f=ev->accept();
        if (!f)
            return;

        f->write(encodeAscii("hello world"));
        f->close();
    });
}

void runtime_start() {
}

void runtime_loop() {
	Timer::loop();
}

void runtime_stop() {
	clearTimers();
}
