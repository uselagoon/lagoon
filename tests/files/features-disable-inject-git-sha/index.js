const express = require('express')
const fs = require('fs');
const app = express()

app.get('/', async function (req, res) {
  let result = []
  Object.keys(process.env).map(key => {
    result.push(`${key}=${process.env[key]}`)
  })
  result.sort()

  try {
    result.push(fs.readFileSync('/files/cron.txt').toString());
  } catch (e) {
    // intentionally left empty
  }

  res.send(result.join("<br />"))

})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
