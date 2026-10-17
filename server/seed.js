require("dotenv").config();
const mongoose = require("mongoose");
const Item = require("./models/Item");

const catalog = [
  { prefix: "BASYS3", name: "Basys 3 FPGA Board", category: "fpga", count: 6,
    specs: { chip: "Artix-7 XC7A35T", clock: "100 MHz", switches: 16, leds: 16, pushButtons: 5, display: "4-digit 7-segment" } },
  { prefix: "MAP", name: "MAP Sensor", category: "automobile_sensor", count: 3,
    specs: { voltageRange: "0-5V", output: "analog", pins: 3 } },
  { prefix: "TPS", name: "Throttle Position Sensor", category: "automobile_sensor", count: 3,
    specs: { type: "potentiometer", voltageRange: "0-5V", pins: 3 } },
  { prefix: "O2", name: "Oxygen (Lambda) Sensor", category: "automobile_sensor", count: 2,
    specs: { type: "narrowband", wires: 4, heated: true } },
  { prefix: "ARD", name: "Arduino Uno R3", category: "microcontroller", count: 6,
    specs: { mcu: "ATmega328P", clock: "16 MHz", flash: "32KB", digitalPins: 14, analogPins: 6 } },
  { prefix: "ESP32", name: "ESP32 DevKit V1", category: "microcontroller", count: 4,
    specs: { mcu: "ESP32-WROOM-32", clock: "240 MHz", wifi: true, bluetooth: true } },
  { prefix: "STM32", name: "STM32 Nucleo F446RE", category: "microcontroller", count: 3,
    specs: { mcu: "STM32F446RET6", core: "ARM Cortex-M4", clock: "180 MHz" } },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Item.deleteMany({});
  const items = [];
  for (const c of catalog) {
    for (let i = 1; i <= c.count; i++) {
      items.push({
        assetTag: `${c.prefix}-${String(i).padStart(3, "0")}`,
        name: c.name, category: c.category, specs: c.specs,
      });
    }
  }
  await Item.insertMany(items);
  console.log(`Seeded ${items.length} items`);
  process.exit(0);
})();
