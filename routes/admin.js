'use strict'

const MongoClient = require('mongodb').MongoClient

let usersCollection
if (process.env.MONGO_URI) { 
  // Connect to MongoDB Database and return user connection
  MongoClient.connect(process.env.MONGO_URI, (err, mongoClient) => {
    if (err) throw new Error(err)
    const dbName = process.env.MONGO_URI.split('/').pop().split('?').shift()
    const db = mongoClient.db(dbName)
    usersCollection = db.collection('users')
  })
}

module.exports = (expressApp, functions) => {

  if (expressApp === null) {
    throw new Error('expressApp option must be an express server instance')
  }

  expressApp.get('/admin/unverified', (req, res) => {
    // Check user is logged in and has admin access
    if (!req.user || !req.user.admin || req.user.admin !== true)
      return res.status('403').end()
      
    const page = (req.query.page && parseInt(req.query.page) > 0) ? parseInt(req.query.page) : 1
    const sort = (req.query.sort) ? { [req.query.sort]: 1 } : {}
    
    let size = 10
    if (req.query.size 
        && parseInt(req.query.size) > 0
        && parseInt(req.query.size) < 500) {
      size = parseInt(req.query.size)
    }

    const skip = (size*(page-1) > 0) ? size*(page-1) : 0
    
    let response = {
      users: [],
      page: page,
      size: size,
      sort: req.params.sort,
      total: 0
    }
    
    if (req.params.sort) response.sort = req.params.sort
    
    let result
    return new Promise(function(resolve, reject) {
      result = usersCollection
      .find({ type: "doctor", clinicID: req.user.id.toString(), $or: [ { clinicVerified: { $exists: false } }, { clinicVerified: { $ne: true } } ] })
      .skip(skip)
      .sort(sort)
      .limit(size)
      
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
      return result.count()
    })
    .then(count => {
      response.total = count
      return res.json(response)
    })
    .catch(err => {
      return res.status(500).json(err)
    })
    
  })

  // Expose a route to delete doctor accounts
  expressApp.post('/admin/verify', (req, res) => {
    if (req.user && req.user.admin && req.user.admin === true) {
      functions.find({id: req.body.id})
      .then(user => {
        if (!user) return res.status(500).json({error: 'Unable to fetch doctor'})
        
        user.clinicVerified = true

        return functions.update(user)
      })
      .then(() => {
        return res.json({ok: true})
      })
      .catch(err => {
        return res.status(500).json({error: 'Unable to verify doctor'})
      })
    } else {
      return res.status(403).json({error: 'Must be signed in with clinic account to verify doctors'})
    }
  })

  // Expose a route to delete doctor accounts
  expressApp.post('/admin/delete', (req, res) => {
    if (req.user && req.user.admin && req.user.admin === true) {
      functions.remove(req.body.id)
      .then(() => {
        return res.json({ok: true})
      })
      .catch(err => {
        return res.status(500).json({error: 'Unable to delete doctor'})
      })
    } else {
      return res.status(403).json({error: 'Must be signed in with clinic account to delete doctors'})
    }
  })

  // Expose a route to assign patients to doctors
  expressApp.post('/admin/assign', (req, res) => {
    if (req.user && req.user.admin && req.user.admin === true) {
      functions.find({id: req.body.doctorID})
      .then(user => {
        if (!user) return res.status(500).json({error: 'Unable to fetch doctor'})
        
        user.patients = req.body.patients

        return functions.update(user)
      })
      .then(() => {
        return res.json({ok: true})
      })
      .catch(err => {
        return res.status(500).json({error: 'Unable to verify doctor'})
      })
    } else {
      return res.status(403).json({error: 'Must be signed in with clinic account to verify doctors'})
    }
  })

}