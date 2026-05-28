#include "runtime.h"
#include "Timer.h"
#include "Sys.h"
//#include "Fs.h"
#include <cassert>
#include "encoding.h"
#ifdef ARDUINO
#include <Arduino.h>
#endif

void serialWriteString(std::string s) {
#if defined(ARDUINO)
    Serial.printf("%s\n",s.c_str());
#elif defined(ESP_PLATFORM)
    printf("%s\n",s.c_str());
#endif
}

void runtime_setup() {
    /*Fs::getInstance()->openEvent.on([](std::shared_ptr<OpenEvent> ev) {
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
    });*/

    Sys::getInstance()->setup();
}

void runtime_start() {
    Sys::getInstance()->start();
}

void runtime_loop() {
    Sys::getInstance()->loop();
	Timer::loop();
}

void runtime_stop() {
	clearTimers();
}
