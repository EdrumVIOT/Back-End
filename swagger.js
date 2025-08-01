const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'TEST API',
    description: 'Description'
  },
  host: 'localhost:3000'
  // host: '192.168.1.168:3000'
};

const outputFile = './swagger-output.json';
const routes = ['./server.js'];


swaggerAutogen(outputFile, routes, doc);



