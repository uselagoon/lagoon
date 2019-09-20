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

app.get('/ts', async function (req, res) {
  const getFileUpdatedDate = (path) => {
    try {
      if (fs.existsSync(path)) {
        const stats = fs.statSync(path)
        return stats.mtime
      }
    } catch(err) {
      console.error(err)
      const stats = fs.statSync('/files/cron.txt')
      return stats.mtime
    }
  }

  res.send(String(getFileUpdatedDate("/files/cron_test.txt").getTime()).slice(0,-3))
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
