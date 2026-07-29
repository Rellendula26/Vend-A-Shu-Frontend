#!/usr/bin/env python3
import argparse
import time

try:
    from gpiozero import LED, Servo
except ImportError as exc:
    raise RuntimeError(
        "gpiozero is required on Raspberry Pi to control servo and LEDs."
    ) from exc


SERVO_MIN_PULSE_WIDTH = 0.0005
SERVO_MAX_PULSE_WIDTH = 0.0025
LED_LEAD_IN_SECONDS = 1
SERVO_FORWARD_HOLD_SECONDS = 3
SERVO_RETURN_HOLD_SECONDS = 3
SERVO_HOME_POSITION = -1
SERVO_DISPENSE_POSITION = 1


def main() -> None:
    parser = argparse.ArgumentParser(description="Drive a single vending drawer")
    parser.add_argument(
        "--motor-pin", type=int, required=True, help="BCM GPIO pin number for motor"
    )
    parser.add_argument(
        "--led-pin",
        type=int,
        action="append",
        default=[],
        help="BCM GPIO pin number for LED to toggle while dispensing (repeatable)",
    )
    args = parser.parse_args()

    leds = [LED(led_pin) for led_pin in args.led_pin]
    servo = Servo(
        args.motor_pin,
        min_pulse_width=SERVO_MIN_PULSE_WIDTH,
        max_pulse_width=SERVO_MAX_PULSE_WIDTH,
    )

    try:
        # Ensure a known starting position before dispensing.
        servo.value = SERVO_HOME_POSITION
        time.sleep(0.2)

        for led in leds:
            led.on()

        time.sleep(LED_LEAD_IN_SECONDS)
        servo.value = SERVO_DISPENSE_POSITION
        time.sleep(SERVO_FORWARD_HOLD_SECONDS)

        # Return to original position by moving back the same range.
        servo.value = SERVO_HOME_POSITION
        time.sleep(SERVO_RETURN_HOLD_SECONDS)
    finally:
        for led in leds:
            led.off()
            led.close()
        # Release servo control to avoid jittering after movement.
        servo.detach()
        servo.close()


if __name__ == "__main__":
    main()
