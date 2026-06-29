#include "pk-littlefs.h"
#include "Fs.h"
#include <fcntl.h>
#include <unistd.h>
#include <sys/stat.h>
#include <errno.h>
#include <stdio.h>
#include <string.h>
#include "esp_spiffs.h"

void littlefs_setup() {
	esp_vfs_spiffs_conf_t conf = {
	    .base_path = "/storage",
	    .partition_label = NULL,
	    .max_files = 5,
	    .format_if_mount_failed = true,
	};

	ESP_ERROR_CHECK(esp_vfs_spiffs_register(&conf));

    // Read
    Fs::getInstance()->openEvent.on([](std::shared_ptr<OpenEvent> ev) {
        if (ev->getMode()!="r")
            return;

        const std::string path=ev->getPathname();
        if (path.rfind("/dev/", 0) == 0)
            return;

        if (path[0]!='/')
            return;

        std::string fullPath="/storage"+path;
        int fid=open(fullPath.c_str(),O_RDONLY);

        //printf("opening for read: %s, fid: %d, errno: %d, err: %s\n",fullPath.c_str(),fid,errno,strerror(errno));
        if (fid<0)
        	return;

        auto f=ev->accept();
        if (!f)
            return;

        f->drainEvent.on([f,fid]() mutable {
            int size=f->getDataWriteAdviceSize();
            if (!size)
                return;

            if (size<0)
                size=1024;

            if (size>1024)
                size=1024;

            std::vector<uint8_t> buffer(size);
            size_t n=read(fid, buffer.data(), buffer.size());
            //printf("storage read bytes: %d\n",n);
            buffer.resize(n);

            if (n)
                f->write(buffer);

            else {
                //Serial.printf("littlefs closing hw file \n");
                close(fid);
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

        const std::string path=ev->getPathname();
        if (path.rfind("/dev/", 0) == 0)
            return;

        if (path[0]!='/')
            return;

        std::string fullPath="/storage"+path;
        int fid=open(fullPath.c_str(),O_WRONLY | O_CREAT | O_TRUNC);

        //printf("opening for write: %s, fid: %d, errno: %d, err: %s\n",fullPath.c_str(),fid,errno,strerror(errno));
        if (fid<0)
        	return;

        auto f=ev->accept();
        if (!f)
            return;

		f->setDataEventSize(1024);

        f->dataEvent.on([fid](std::vector<uint8_t> data) mutable {
        	write(fid,data.data(), data.size());
        });

        f->closeEvent.on([fid]() mutable {
        	close(fid);
        });
    });
}