#include "Fs.h"
#include "serial-console.h"
#include <cassert>
#include <cstring>
#include "hal/usb_serial_jtag_ll.h"

static std::vector<std::shared_ptr<FileHandle>> openConsoles;

void serial_console_setup() {
	Fs::getInstance()->openEvent.on([](std::shared_ptr<OpenEvent> ev) {
		if (ev->getPathname()!="/dev/console")
			return;

		auto f=ev->accept();
		if (!f)
			return;

		openConsoles.push_back(f);

		f->dataEvent.on([](std::vector<uint8_t> data) {
			write(STDOUT_FILENO,data.data(),data.size());
			usb_serial_jtag_ll_txfifo_flush();
			//printf("data...\n");
		});

		f->closeEvent.on([f](){
			//Serial.printf("closing console...\n");
			openConsoles.erase(
			    std::remove(openConsoles.begin(), openConsoles.end(), f),
			    openConsoles.end()
			);
		});
	});

    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stdout, NULL, _IONBF, 0);
}

void serial_console_loop() {
    std::vector<uint8_t> buffer;
    int c=0;

    while (c>=0) {
		c=getchar();
		if (c>=0)
			buffer.push_back(c);
    }

    if (!buffer.empty()) {
    	//printf("got some...\n");
        for (auto c: openConsoles)
            c->write(buffer);
    }
}

void serial_console_start() {
}

void serial_console_stop() {
	openConsoles.clear();
	//Serial.printf("closing consoles, cap=%d\n",openConsoles.capacity());
}
