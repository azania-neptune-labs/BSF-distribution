//{ did: 'did:ethr:0xf04f106ae901a50aba75c2b36db657d4e7f77760',
//  privateKey:
//   'fa6e8fd2acc7da74a50634a1932cbdd206096e1b3d059804cb690a10a8a21de9' }//

const express = require('express')
const bodyParser = require('body-parser')
const ngrok = require('ngrok')
const decodeJWT = require('did-jwt').decodeJWT
const { Credentials } = require('uport-credentials')
const transports = require('uport-transports').transport
const message = require('uport-transports').message.util

let endpoint = ''
const app = express();
app.use(bodyParser.json({ type: '*/*' }))

//setup Credentials object with newly created application identity.
const credentials = new Credentials({
  appName: 'Request Verification Example',
  did: 'did:ethr:0xf04f106ae901a50aba75c2b36db657d4e7f77760',
  privateKey: 'fa6e8fd2acc7da74a50634a1932cbdd206096e1b3d059804cb690a10a8a21de9'
})

app.get('/', (req, res) => {
  credentials.createDisclosureRequest({
    verified: ['Example'],
    callbackUrl: endpoint + '/index.html'
  }).then(requestToken => {
    console.log(decodeJWT(requestToken))  //log request token to console
    const uri = message.paramsToQueryString(message.messageToURI(requestToken), {callback_type: 'post'})
    const qr =  transports.ui.getImageDataURI(uri)
    res.send(`<div><img src="${qr}"/></div>`)
  })
})
app.post('/index.html', (req, res) => {
  const jwt = req.body.access_token
  console.log(jwt)
  console.log(decodeJWT(jwt))
  credentials.authenticateDisclosureResponse(jwt).then(creds => {
    //validate specific data per use case
    console.log(creds)
    console.log(creds.verified[0])
  }).catch( err => {
    console.log("oops")
  })
})

// run the app server and tunneling service
const server = app.listen(8088, () => {
  ngrok.connect(8088).then(ngrokUrl => {
    endpoint = ngrokUrl
    console.log(`Verification Service running, open at ${endpoint}`)
  })
})