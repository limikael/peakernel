#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include <stdio.h>
#include "peakernel.h"

#define LED_GPIO GPIO_NUM_8  // built-in LED on many ESP32 boards

extern "C" {

void app_main(void) {
    peakernel_setup();

    // Configure GPIO
    gpio_reset_pin(LED_GPIO);
    gpio_set_direction(LED_GPIO, GPIO_MODE_OUTPUT);

    while (1) {
        peakernel_loop();

        multi_heap_info_t info;
        heap_caps_get_info(&info, MALLOC_CAP_DEFAULT);
        printf("hello, used=%d ... free=%d\n",info.total_allocated_bytes,info.total_free_bytes);

        gpio_set_level(LED_GPIO, 1);
        vTaskDelay(pdMS_TO_TICKS(100));

        gpio_set_level(LED_GPIO, 0);
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

}