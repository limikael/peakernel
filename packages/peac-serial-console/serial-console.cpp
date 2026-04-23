#include <Arduino.h>
#include "Fs.h"
#include "serial-console.h"
#include <cassert>

static std::vector<std::shared_ptr<FileHandle>> openConsoles;

std::vector<uint8_t> static stringToVec(std::string s) {
	std::vector<unsigned char> v(s.begin(), s.end());
	return v;
}

void serial_console_setup() {
    Serial.begin(112500);
	Fs::getInstance()->openEvent.on([](std::shared_ptr<OpenEvent> ev) {
		if (ev->getPathname()!="/dev/console")
			return;

		auto f=ev->accept();
		if (!f)
			return;

		openConsoles.push_back(f);

		f->setDataEventSize(64);
		f->dataEvent.on([](std::vector<uint8_t> data) {
			Serial.write(data.data(),data.size());
			Serial.flush();

		    int av=Serial.availableForWrite();
		    if (av>64)
		    	av=64;

		    if (Serial.available())
		    	av=0;

		    for (auto c: openConsoles)
		    	c->setDataEventSize(av);

		    //Serial.printf("set buf size: %d\n",av);
		});

		f->closeEvent.on([f](){
			//Serial.printf("closing console...\n");
			openConsoles.erase(
			    std::remove(openConsoles.begin(), openConsoles.end(), f),
			    openConsoles.end()
			);
		});
	});
}

void serial_console_loop() {
    std::vector<uint8_t> buffer;

    bool didRead=false;
    while (Serial.available()) {
	    int available=Serial.available();
        buffer.resize(available);
        Serial.readBytes(buffer.data(), available);
        for (auto c: openConsoles)
        	c->write(buffer);

        didRead=true;
    }

    int av=Serial.availableForWrite();
    if (didRead || Serial.available())
		av=0;

    if (av>64)
    	av=64;
    for (auto c: openConsoles)
    	c->setDataEventSize(av);
}

void serial_console_start() {
}

void serial_console_stop() {
	//Serial.printf("actually closing...\n");
	openConsoles.clear();
}
