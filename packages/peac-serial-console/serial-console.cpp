#include <Arduino.h>
#include "Fs.h"
#include "serial-console.h"
#include <cassert>

static std::vector<std::shared_ptr<FileHandle>> openConsoles;

int getAllowedSendSize() {
	if (Serial.available())
		return 0;

	int av=Serial.availableForWrite();
	if (av>64)
		av=64;

	return av;
}

void serial_console_setup() {
	Serial.setRxBufferSize(2048);
	Serial.setTxBufferSize(256); // 1024?
    Serial.begin(112500);
	Fs::getInstance()->openEvent.on([](std::shared_ptr<OpenEvent> ev) {
		if (ev->getPathname()!="/dev/console")
			return;

		auto f=ev->accept();
		if (!f)
			return;

		openConsoles.push_back(f);

		f->setDataEventSize(getAllowedSendSize());
		f->dataEvent.on([](std::vector<uint8_t> data) {
			Serial.write(data.data(),data.size());
			Serial.flush();

		    int av=getAllowedSendSize();
		    for (auto c: openConsoles)
		    	c->setDataEventSize(av);
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
	buffer.reserve(256);
	bool didRead=false;

	while (Serial.available()) {
		didRead=true;
		int av=Serial.available();
		size_t oldSize = buffer.size();
	    buffer.resize(oldSize + av);
	    int n = Serial.read(buffer.data() + oldSize, av);
	    buffer.resize(oldSize + n);
    }

    if (!buffer.empty()) {
        for (auto c: openConsoles)
            c->write(buffer);
    }

    int av=getAllowedSendSize();
    for (auto c: openConsoles)
    	c->setDataEventSize(av);
}

void serial_console_start() {
}

void serial_console_stop() {
	openConsoles.clear();
	//Serial.printf("closing consoles, cap=%d\n",openConsoles.capacity());
}
