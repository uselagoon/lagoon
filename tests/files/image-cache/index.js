const express = require('express')
const app = express()
const fs = require('fs')

// Adds a 1 sec delay for all requests
app.use((req, res, next) => setTimeout(next, 1000))

let testFile = '/files/testoutput.txt'

// clear out file if it already exists
try {
  fs.unlinkSync(testFile);
  //file removed
} catch(err) {
  console.error(err)
}

app.get('/', function (req, res) {
  let result = []
  let data = 'TO BE REPLACED'
  if (fs.existsSync(testFile)) {
    data = fs.readFileSync(testFile, 'utf8')
  }

  result.push(data)
  res.send(result.join("<br />"))
})

const server = app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

const startGracefulShutdown = () => {
  console.log('Starting shutdown of express...');
  server.close(function () {
    console.log('Express shut down.');
  });
}

process.on('SIGTERM', startGracefulShutdown);
process.on('SIGINT', startGracefulShutdown);
