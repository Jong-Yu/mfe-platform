module.exports = {
  "service": "b",
  "kind": "remote",
  "exposes": {
    "./Widget": "./src/Widget.jsx",
    "./helper": "./src/helper.js"
  },
  "widgets": [
    {
      "id": "car-picker",
      "title": "차량 선택",
      "exposedModule": "./Widget",
      "contract": "platform-widget-v1"
    }
  ]
};
