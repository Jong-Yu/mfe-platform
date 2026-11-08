module.exports = {
  "service": "b",
  "kind": "remote",
  "exposes": {
    "./Widget": "./src/Widget.jsx",
    "./helper": "./src/helper.js",
    "./Summary": "./src/Summary.jsx"
  },
  "widgets": [
    {
      "id": "car-picker",
      "title": "차량 선택",
      "exposedModule": "./Widget",
      "contract": "platform-widget-v1"
    },
    {
      "id": "summary",
      "title": "차량 요약",
      "exposedModule": "./Summary",
      "contract": "platform-widget-v1"
    }
  ]
};
