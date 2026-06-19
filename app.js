const express = require('express')
const expressWs = require('express-ws')

const app = express()
expressWs(app)

const port = process.env.PORT || 3001
let connects = []

app.use(express.static('public'))

function broadcast(msg, exclude = null) {
  const data = JSON.stringify(msg)
  connects.forEach(({ ws }) => {
    if (ws !== exclude && ws.readyState === 1) ws.send(data)
  })
}

function broadcastAll(data) {
  connects.forEach(({ ws }) => {
    if (ws.readyState === 1) ws.send(data)
  })
}

function sendUserCount() {
  const count = connects.length
  broadcastAll(JSON.stringify({ type: 'userCount', count }))
}

app.ws('/ws', (ws, req) => {
  let clientId = null

  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message)
      if (msg.type === 'join') {
        clientId = msg.id
        connects.push({ ws, id: clientId })
        broadcast({ type: 'join', id: clientId }, ws)
        sendUserCount()
      } else {
        broadcastAll(message)
      }
    } catch (e) {
      console.error('Parse error:', e)
    }
  })

  ws.on('close', () => {
    connects = connects.filter((c) => c.ws !== ws)
    if (clientId) {
      broadcast({ type: 'leave', id: clientId })
      sendUserCount()
    }
  })
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
