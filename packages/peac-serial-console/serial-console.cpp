#include <Arduino.h>
#include "Fs.h"
#include "serial-console.h"
#include <cassert>

void serial_console_setup() {
	Fs::getInstance()->openRequest.on([](std::shared_ptr<OpenEvent> ev) {
		if (ev->getPathname()!="/dev/console")
			return;

		auto f=ev->accept();
		if (!f)
			return;

		f->data.on([](std::vector<uint8_t> data) {
			Serial.write(data.data(),data.size());
			Serial.flush();
		});
	});
}
