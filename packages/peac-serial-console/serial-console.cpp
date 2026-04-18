#include <Arduino.h>
#include "Fs.h"
#include "serial-console.h"
#include <cassert>

// FIX! close the files...
static std::vector<std::shared_ptr<FileHandle>> openConsoles;

void serial_console_setup() {
	Fs::getInstance()->openRequest.on([](std::shared_ptr<OpenEvent> ev) {
		if (ev->getPathname()!="/dev/console")
			return;

		auto f=ev->accept();
		if (!f)
			return;

		openConsoles.push_back(f);

		f->data.on([](std::vector<uint8_t> data) {
			Serial.write(data.data(),data.size());
			Serial.flush();
		});
	});
}

void serial_console_loop() {
    std::vector<uint8_t> buffer;

    int available=Serial.available();
    if (available>0) {
        //Serial.printf("reading %d bytes...\n",available);

        buffer.resize(available);
        Serial.readBytes(buffer.data(), available);
        for (auto c: openConsoles)
        	c->write(buffer);
    }
}
