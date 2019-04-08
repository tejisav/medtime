'use strict'

const MongoClient = require('mongodb').MongoClient
const MongoObjectId = (process.env.MONGO_URI) ? require('mongodb').ObjectId : (id) => { return id }

const nodemailer = require('nodemailer')
const nodemailerSmtpTransport = require('nodemailer-smtp-transport')
const nodemailerDirectTransport = require('nodemailer-direct-transport')

let schedulesCollection, usersCollection
if (process.env.MONGO_URI) {
  MongoClient.connect(process.env.MONGO_URI, (err, mongoClient) => {
    if (err) throw new Error(err)
    const dbName = process.env.MONGO_URI.split('/').pop().split('?').shift()
    const db = mongoClient.db(dbName)
    schedulesCollection = db.collection('schedules')
    usersCollection = db.collection('users')
  })
}

// Send email direct from localhost if no mail server configured
let nodemailerTransport = nodemailerDirectTransport()
if (process.env.EMAIL_SERVER && process.env.EMAIL_USERNAME && process.env.EMAIL_PASSWORD) {
  nodemailerTransport = nodemailerSmtpTransport({
      host: process.env.EMAIL_SERVER,
      port: process.env.EMAIL_PORT || 25,
      secure: process.env.EMAIL_SECURE || true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    })
}

module.exports = () => {
  schedulesCollection.find( { events: { $elemMatch: { end: {$lt: new Date().toISOString()}, completed:false, missed: false } } }  ).project( { patientID: 1, events: 1 } ).toArray(function(err, schedules) {
    if (err) { 
      console.log(err)
      return
    }
    for (let i = 0; i < schedules.length; i++) {
      usersCollection.findOne( { _id: MongoObjectId(schedules[i].patientID) }, { fields: { _id: 0, email: 1 } }, function(err, user) {
        if (err) { 
          console.log(err)
          return
        }
        let events = schedules[i].events
        let missed = []
        for (let j = 0; j < events.length; j++) {
          if (!events[j].completed && !events[j].missed && new Date(events[j].end) < new Date()) {
            missed.push( {name: events[j].title, time: new Date(events[j].end).toLocaleString()} )
            schedulesCollection
            .updateOne( { _id: schedules[i]._id, "events.id": events[j].id}, { $set: { "events.$.missed" : true } } )
            .catch(err => {
              console.error(err)
            })
          }
        }
        
        nodemailer
        .createTransport(nodemailerTransport)
        .sendMail({
          to: user.email,
          from: process.env.EMAIL_FROM,
          subject: 'Missed Medication',
          text: `You missed the following medication:\n\n${missed.map((a) => `${a.name}: ${a.time}`).join('\n')}\n\n`,
          html: `<p>You missed the following medication:</p><p>${missed.map((a) => `${a.name}: ${a.time}`).join('<br />')}</p>`
        }, (err) => {
          if (err) {
            console.error('Error sending email to ' + email, err)
          }
        })
      })
    }
  })
}