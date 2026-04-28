#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "esp_task_wdt.h"
#include <stdio.h>
#include "peakernel.h"

extern "C" {

void peakernel_task(void *arg) {
    peakernel_setup();

    while (1) {
        peakernel_loop();
        vTaskDelay(1);
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
/*    
    peakernel_setup();
    //esp_task_wdt_add(NULL);

    while (1) {
        peakernel_loop();
        vTaskDelay(1);
        //esp_task_wdt_reset();
        //vTaskDelay(0);
    }
*/
}
}

