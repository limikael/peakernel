#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "esp_task_wdt.h"
#include <stdio.h>
#include "peakernel.h"

extern "C" {

void peakernel_task(void *arg) {
    peakernel_notify_setup();
    peakernel_notify_start();

    while (1) {
        vTaskDelay(1);
        //taskYIELD();
        peakernel_notify_loop();
    }
}

void app_main(void) {
    xTaskCreate(
        peakernel_task,
        "peakernel",
        8192,
        NULL,
        5,
        NULL
    );
}

}