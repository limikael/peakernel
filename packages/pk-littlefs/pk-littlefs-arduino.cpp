#include <Arduino.h>
#include <LittleFS.h>
#include "Fs.h"
#include "pk-littlefs.h"

void littlefs_setup() {
    LittleFS.begin(true);  // or SPIFFS.begin(true)
    //mounted=true;

    // Read
    Fs::getInstance()->openEvent.on([](std::shared_ptr<OpenEvent> ev) {
        if (ev->getMode()!="r" || ev->getPathname()=="/hello" || ev->getPathname()=="/hello2")
            return;

        const std::string path = ev->getPathname();
        if (path.rfind("/dev/", 0) == 0)
            return;

        File file = LittleFS.open(path.c_str(), "r");
        if (!file || file.isDirectory()) {
            return; // let other plugins handle it
        }

        auto f=ev->accept();
        if (!f)
            return;

        f->drainEvent.on([f,file]() mutable {
            int size=f->getDataWriteAdviceSize();
            if (!size)
                return;

            if (size<0)
                size=1024;

            if (size>1024)
                size=1024;

            std::vector<uint8_t> buffer(size);
            size_t n=file.read(buffer.data(), buffer.size());
            //printf("littlefs read bytes: %d\n",n);
            buffer.resize(n);

            if (n)
                f->write(buffer);

            else {
                //Serial.printf("littlefs closing hw file \n");
                file.close();
                //Serial.printf("littlefs closing sys file \n");
                f->close();
                //Serial.printf("done closing \n");
            }
        });
    });

    // Write
    Fs::getInstance()->openEvent.on([](std::shared_ptr<OpenEvent> ev) {
        if (ev->getMode()!="w")
            return;

        const std::string path = ev->getPathname();
        if (path.rfind("/dev/", 0) == 0)
            return;

        File file = LittleFS.open(path.c_str(), "w");
        if (!file || file.isDirectory()) {
            return; // let other plugins handle it
        }

        auto f=ev->accept();
        if (!f)
            return;

        f->setDataEventSize(1024);

        f->dataEvent.on([file](std::vector<uint8_t> data) mutable {
            file.write(data.data(), data.size());
            file.flush();
        });

        f->closeEvent.on([file]() mutable {
            file.close();
        });
    });
}
