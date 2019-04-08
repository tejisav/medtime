'use strict'

const fs = require('fs-extra')
const MongoClient = require('mongodb').MongoClient
const MongoObjectId = (process.env.MONGO_URI) ? require('mongodb').ObjectId : (id) => { return id }
const multer = require('multer')
const upload = multer( { limits: {fileSize: 2000000 }, dest:'./uploads/' } )

let usersCollection, reportsCollection, schedulesCollection
if (process.env.MONGO_URI) {
  MongoClient.connect(process.env.MONGO_URI, (err, mongoClient) => {
    if (err) throw new Error(err)
    const dbName = process.env.MONGO_URI.split('/').pop().split('?').shift()
    const db = mongoClient.db(dbName)
    usersCollection = db.collection('users')
    reportsCollection = db.collection('reports')
    schedulesCollection = db.collection('schedules')
  })
}

module.exports = (expressApp, functions) => {

  if (expressApp === null) {
    throw new Error('expressApp option must be an express server instance')
  }

  // Expose a route to return user profile if logged in with a session
  expressApp.get('/account/user', (req, res) => {
    if (req.user) {
      functions.find({id: req.user.id})
      .then(user => {
        if (!user) return res.status(500).json({error: 'Unable to fetch profile'})
        res.json({
          name: user.name,
          email: user.email,
          emailVerified: (user.emailVerified && user.emailVerified === true) ? true : false,
          address: user.address,
          srcAvatar: user.srcAvatar
        })
      })
      .catch(err => {
        return res.status(500).json({error: 'Unable to fetch profile'})        
      })
    } else {
      return res.status(403).json({error: 'Must be signed in to get profile'})
    }
  })
  
  // Expose a route to allow users to update their profiles (name, email)
  expressApp.post('/account/user', (req, res) => {
    if (req.user) {
      functions.find({id: req.user.id})
      .then(user => {
        if (!user) return res.status(500).json({error: 'Unable to fetch profile'})
        
        if (req.body.clinicID)
          user.clinicID = req.body.clinicID
          
        if (req.body.type)
          user.type = req.body.type

        if (req.body.name)
          user.name = req.body.name

        if (req.body.email) {
          // Reset email verification field if email address has changed
          if (req.body.email && req.body.email !== user.email)
            user.emailVerified = false
        
          user.email = req.body.email
        }
        
        if (req.body.password)
          user.password = req.body.password
        
        if (req.body.signUpComplete)
          user.signUpComplete = true
          
        if(req.body.src) {
          user.srcAvatar = req.body.src
        }

        if(req.body.address) {
          user.address = req.body.address
        }

        return functions.update(user)
      })
      .then(user => {
        return res.status(204).redirect('/account')
      })
      .catch(err => {
        return res.status(500).json({error: 'Unable to fetch profile'})        
      })
    } else {
      return res.status(403).json({error: 'Must be signed in to update profile'})
    }
  })
  
  // Expose a route to allow users to delete their profile.
  expressApp.post('/account/delete', (req, res) => {
    if (req.user) {
      functions.remove(req.user.id)
      .then(() => {
        // Destroy local session after deleting account
        req.logout()
        req.session.destroy(() => {
          // When the account has been deleted, redirect client to 
          // /auth/callback to ensure the client has it's local session state 
          // updated to reflect that the user is no longer logged in.          
          return res.redirect(`/auth/callback?action=signout`)
        })
      })
      .catch(err => {
        return res.status(500).json({error: 'Unable to delete profile'})        
      })
    } else {
      return res.status(403).json({error: 'Must be signed in to delete profile'})
    }
  })

  // Expose a route to return clinic profile if logged in with a session
  expressApp.get('/account/clinics', (req, res) => {
    if (req.user) {
      let result
      return new Promise(function(resolve, reject) {
        result = usersCollection
        .find({ type: "clinic" })
        
        result.toArray((err, users) => {
          if (err) {
            reject(err)
          } else {
            resolve(users)
          }
        })
      })
      .then(users => {
        return res.json(users)
      })
      .catch(err => {
        return res.status(500).json(err)
      })
    } else {
      return res.status(403).json({error: 'Must be signed in to get profile'})
    }
  })

  expressApp.get('/account/users', (req, res) => {
    // Check user is logged in and has admin access
    if (!req.user)
      return res.status('403').end()
    
    let response = {
      users: []
    }
    
    let result
    return new Promise(function(resolve, reject) {
      result = usersCollection
      .find({ $or: [ { $and: [ { type: "doctor" }, { clinicVerified: { $exists: true } }, { clinicVerified: { $ne: false } } ] }, { type: "patient" } ], clinicID: req.user.clinicID.toString() })
      
      result.toArray((err, users) => {
        if (err) {
          reject(err)
        } else {
          resolve(users)
        }
      })
    })
    .then(users => {
      response.users = users
      return res.json(response)
    })
    .catch(err => {
      return res.status(500).json(err)
    })
    
  })

  // Expose a route to assign patients to doctors
  expressApp.post('/account/selected', (req, res) => {
    if (req.user) {
      functions.find({id: req.user.id})
      .then(user => {
        if (!user) return res.status(500).json({error: 'Unable to fetch user'})
        
        user.selectedUser = req.body.selectedUser

        return functions.update(user)
      })
      .then(() => {
        return res.json({ok: true})
      })
      .catch(err => {
        return res.status(500).json({error: 'Unable to update selectedUser'})
      })
    } else {
      return res.status(403).json({error: 'Must be signed in to select users'})
    }
  })

  expressApp.post('/account/upload', upload.single('report'), (req, res) => {
    if (req.user) {
      if (req.file == null) {
        return res.status(500).json({error: 'No file found to upload!'})
      } else {
        let img = fs.readFileSync(req.file.path);
        let encImg = img.toString('base64');
        let report = {
          contentType: req.file.mimetype,
          img: Buffer.from(encImg, 'base64'),
          dateAdded: new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        }
        if (req.user.type === "doctor" && req.user.clinicVerified && req.user.selectedUser) {
          report.doctorID = req.user.id.toString()
          report.patientID = req.user.selectedUser
        } else {
          return res.status(403).json({error: 'Not enough permissions!'})
        }
        reportsCollection
        .insertOne(report, function(err, result) {
          if (err) { console.log(err) }
          fs.remove(req.file.path, function(err) {
            if (err) { console.log(err) }
            return res.redirect(`/reports`)
          })
        })
      }
    } else {
      return res.status(403).json({error: 'Must be signed in to upload reports'})
    }
  })

  expressApp.get('/image/:id', (req, res) => {
    if (req.user) {
      reportsCollection.findOne({ _id: MongoObjectId(req.params.id) }, (err, results) => {
        if (err) { console.log(err) }
        res.setHeader('content-type', results.contentType)
        res.send(results.img.buffer)
      })
    } else {
      return res.status(403).json({error: 'Must be signed in to get images'})
    }
  })

  expressApp.get('/account/reports', (req, res) => {
    if (req.user) {
      let query = {}
      if (req.user.type === "doctor" && req.user.clinicVerified && req.user.selectedUser) {
        query = { doctorID: req.user.id.toString(), patientID: req.user.selectedUser }
      } else if (req.user.type === "patient" && req.user.selectedUser) {
        query = { patientID: req.user.id.toString(), doctorID: req.user.selectedUser }
      } else {
        return res.status(500).json({error: 'User not selected'})
      }
      reportsCollection.find(query).project({ dateAdded: 1 }).sort({_id:-1}).toArray(function(err, items) {
        if (err) { console.log(err) }
        return res.json(items)
      })
    } else {
      return res.status(403).json({error: 'Must be signed in to get reports'})
    }
  })

  expressApp.post('/account/schedule', (req, res) => {
    if (req.user && req.user.type === "doctor" && req.user.clinicVerified) {
      if (req.user.selectedUser) {
        if (req.body.medicines.length > 0 && req.body.events.length > 0) {
          let first = new Date(new Date().toDateString())
          first.setDate(first.getDate() - 1);
          schedulesCollection.update(
            { doctorID: req.user.id.toString(), patientID: req.user.selectedUser },
            {
              doctorID: req.user.id.toString(),
              patientID: req.user.selectedUser,
              startDate: req.body.startDate,
              endDate: req.body.endDate,
              medicines: req.body.medicines,
              events: req.body.events,
              improvement: {[first.toISOString().split('T')[0]]: 0}
            },
            { upsert: true }
          )
          .then(() => {
            return res.json({ok: true})
          })
          .catch(err => {
            return res.status(500).json({error: 'Unable to add schedule'})
          })
        } else {
          return res.status(500).json({error: 'Invalid data'})
        }
      } else {
        return res.status(500).json({error: 'User not selected'})
      }
    } else {
      return res.status(403).json({error: 'Must be signed in with verified doctor account to add schedule'})
    }
  })

  expressApp.get('/account/schedule', (req, res) => {
    if (req.user) {
      let query = {}
      if (req.user.type === "doctor" && req.user.clinicVerified && req.user.selectedUser) {
        query = { doctorID: req.user.id.toString(), patientID: req.user.selectedUser }
      } else if (req.user.type === "patient" && req.user.selectedUser) {
        query = { patientID: req.user.id.toString(), doctorID: req.user.selectedUser }
      } else {
        return res.status(500).json({error: 'User not selected'})
      }
      schedulesCollection.findOne(query, { fields: { events: 1, _id: 0 } }, (err, results) => {
        if (err) { console.log(err) }
        return res.json(results)
      })
    } else {
      return res.status(403).json({error: 'Must be signed in to get schedule'})
    }
  })

  expressApp.post('/account/event', (req, res) => {
    if (req.user) {
      
      let query = {}
      if (req.user.type === "doctor" && req.user.clinicVerified && req.user.selectedUser) {
        query = { doctorID: req.user.id.toString(), patientID: req.user.selectedUser }
      } else if (req.user.type === "patient" && req.user.selectedUser) {
        query = { patientID: req.user.id.toString(), doctorID: req.user.selectedUser }
      } else {
        return res.status(500).json({error: 'User not selected'})
      }

      if (req.body.event) {
        schedulesCollection
        .updateOne( { ...query, "events.id": req.body.event.id}, { $set: { "events.$.completed" : true } } )
        .then(() => {
          return res.json({ok: true})
        })
        .catch(err => {
          return res.status(500).json({error: 'Unable to update status'})
        })
      } else {
        return res.status(500).json({error: 'Invalid data'})
      }
    } else {
      return res.status(403).json({error: 'Must be signed in to update status'})
    }
  })

  expressApp.get('/account/improvement', (req, res) => {
    if (req.user) {
      let query = {}
      if (req.user.type === "doctor" && req.user.clinicVerified && req.user.selectedUser) {
        query = { doctorID: req.user.id.toString(), patientID: req.user.selectedUser }
      } else if (req.user.type === "patient" && req.user.selectedUser) {
        query = { patientID: req.user.id.toString(), doctorID: req.user.selectedUser }
      } else {
        return res.status(500).json({error: 'User not selected'})
      }
      schedulesCollection.findOne(query, { fields: { startDate: 1, endDate: 1, improvement: 1, _id: 0 } }, (err, results) => {
        if (err) { console.log(err) }
        return res.json(results)
      })
    } else {
      return res.status(403).json({error: 'Must be signed in to get improvement data'})
    }
  })

  expressApp.post('/account/improvement', (req, res) => {
    if (req.user) {
      
      let query = {}
      if (req.user.type === "patient" && req.user.selectedUser) {
        query = { patientID: req.user.id.toString(), doctorID: req.user.selectedUser }
      } else {
        return res.status(500).json({error: 'User not selected'})
      }

      if (req.body) {
        schedulesCollection
        .updateOne( query, { $set: { improvement: req.body} } )
        .then(() => {
          return res.json({ok: true})
        })
        .catch(err => {
          return res.status(500).json({error: 'Unable to submit feedback'})
        })
      } else {
        return res.status(500).json({error: 'Invalid data'})
      }
    } else {
      return res.status(403).json({error: 'Must be signed in to update status'})
    }
  })

}