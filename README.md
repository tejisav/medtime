# MedTime

A platform to manage relation and records to improve patient health.

## About

MedTime is a web application in the medical technology industry, an enormous industry advancing day by day. Every individual at some point in their life needs medication for diseases or allergies. It is often observed that the patients do not take their medication properly and on time which results in lesser or no improvement in their health. Therefore, there are repeated visits to the clinics for the same illness. This application will help patients take their medication on time and assess their own health improvement. Thus, minimizing the chances of repeated visits to clinic and improving patient’s health.

Some technologies medtime is using :-
- React.js & Next.js
- Node.js Express
- Mongo DB
- Chart.js
- Many npm packages, you can check out the package.json

Note: Checkout the Demo section for a live demo.

## Configuration

```
- Rename .env.example to .env and configure the server url, database environment variables using your MongoDB endpoint and email credentials for sending emails
- Make sure your endpoint is accessible to the outside world
- You need to manually add a clinic administration before you can start anything else. Add a "users" collection to your mongo db database. Edit and add the following in your new document inside "users" collection :=

{
   "_id":{
      "$oid":"5c7b872c3acf3701401b7d68"
   },
   "province":"BC",
   "city":"Vancouver",
   "clinic":"Langara Clinic",
   "email":"example@gmail.com",
   "password":"test1234",
   "type":"clinic",
   "admin":true,
   "emailVerified":true,
   "signUpComplete":true
}

Note: You only need to change province, city, clinic, email and password. Rest are all required and should not be changed. When a doctor or patient creates an account they will need to select province, city and clinic which will dynamically come from our clinic account that we just added.
```

## Running locally in development mode

```
git clone https://github.com/tejisav/medtime.git
npm install
npm run dev
```

Note: If you are running on Windows run install --noptional flag (i.e. `npm install --no-optional`) which will skip installing fsevents.

## Building and deploying in production

```
git clone https://github.com/tejisav/medtime.git
npm install
npm run build
npm start
```

You should run `npm run build` again any time you make changes to the site.

Note: If you are already running a webserver on port 80 (e.g. Macs usually have the Apache webserver running on port 80) you can still start the example in production mode by passing a different port as an Environment Variable when starting (e.g. `PORT=3000 npm start`).

## Live demo

Link: [http://medtime.cf/](http://medtime.cf/)

Following are the demo accounts for quickly testing the project.

### Clinic (You will need to manually add this user when setting up the database yourself.)
```
Email: clinic@example.com
Password: test1234
```
### Doctor (You can signup as a doctor but clinic user needs to verify doctor accounts from dashboard and assign patients to them.)
```
Email: doctor@example.com
Password: test1234
```
### Patient (You can signup as a patient too but clinic needs to assign a doctor to your account.)
```
Email: patient@example.com
Password: test1234
```

Note: You need real email for patients for the medication reminder feature to work, which sends an email to the patient if the medicine is missed.

## Video demo

Link: [https://www.youtube.com/watch?v=oCx1foO8HdE](https://www.youtube.com/watch?v=oCx1foO8HdE)

## References

An authentication library for Next.js projects - [https://github.com/iaincollins/next-auth](https://github.com/iaincollins/next-auth)

A starter project for Next.js with authentication - [https://github.com/iaincollins/nextjs-starter](https://github.com/iaincollins/nextjs-starter)