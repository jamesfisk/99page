const express = require('express')
const app = express()

const PORT = process.env.PORT || 3001;

app.use(express.static( __dirname + '/client' ));

app.get('/', (req, res) => {
  res.sendFile(path.join( __dirname, 'client', 'index.html' ));
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})