
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Patient = require('./models/patient');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// MongoDB connection
// mongoose.connect('mongodb://127.0.0.1:27017/patientDB')
//     .then(() => console.log('✅ MongoDB connected'))
//     .catch(err => console.log('❌ Connection Error:', err));


require('dotenv').config();
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ Connection Error:', err));


app.get('/', async (req, res) => {
    try {
      const searchQuery = req.query.search || "";
      const filter = searchQuery
        ? { $or: [
            { name: { $regex: searchQuery, $options: "i" } },
            { doctor: { $regex: searchQuery, $options: "i" } }
          ]}
        : {};
      const patients = await Patient.find(filter);
      const total = patients.length;
      const avgAge = patients.length > 0
        ? (patients.reduce((a,b)=>a+b.age,0)/patients.length).toFixed(1)
        : 0;
  
      res.render('index', { patients, total, avgAge, searchQuery });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  });
  


  app.get('/analytics', async (req, res) => {
    const patients = await Patient.find();

    const diseaseCount = {};
    const doctorCount = {};
    const ageSumByDisease = {};
    const countByDisease = {};

    patients.forEach(p => {
      diseaseCount[p.disease] = (diseaseCount[p.disease] || 0) + 1;
      doctorCount[p.doctor] = (doctorCount[p.doctor] || 0) + 1;
      ageSumByDisease[p.disease] = (ageSumByDisease[p.disease] || 0) + p.age;
      countByDisease[p.disease] = (countByDisease[p.disease] || 0) + 1;
    });

    const avgAgeByDisease = {};
    for (let d in ageSumByDisease) {
      avgAgeByDisease[d] = (ageSumByDisease[d] / countByDisease[d]).toFixed(1);
    }

    let youngest = patients.length > 0 ? patients[0] : null;
    let oldest = patients.length > 0 ? patients[0] : null;
    patients.forEach(p => {
      if (p.age < youngest.age) youngest = p;
      if (p.age > oldest.age) oldest = p;
    });

    let mostCommonDisease = "";
    let maxCount = 0;
    for (let d in diseaseCount) {
      if (diseaseCount[d] > maxCount) {
        maxCount = diseaseCount[d];
        mostCommonDisease = d;
      }
    }

    // ✅ Pass `patients` to EJS so age group distribution works
    res.render('analytics', {
      diseaseCount,
      doctorCount,
      avgAgeByDisease,
      youngest,
      oldest,
      mostCommonDisease,
      patients
    });
});

  




// Add patient page
app.get('/add', (req, res) => {
    res.render('add_patient');
});

// Add patient POST
app.post('/add', async (req, res) => {
    const { name, age, disease, doctor } = req.body;
    const newPatient = new Patient({ name, age, disease, doctor });
    await newPatient.save();
    res.redirect('/');
});

// Edit patient page
app.get('/edit/:id', async (req, res) => {
    const patient = await Patient.findById(req.params.id);
    res.render('edit_patient', { patient });
});

// Update patient POST
app.post('/edit/:id', async (req, res) => {
    const { name, age, disease, doctor } = req.body;
    await Patient.findByIdAndUpdate(req.params.id, { name, age, disease, doctor });
    res.redirect('/');
});

// Delete patient
app.get('/delete/:id', async (req, res) => {
    await Patient.findByIdAndDelete(req.params.id);
    res.redirect('/');
});

// ✅ View Single Patient Details
app.get("/view/:id", async (req, res) => {
    const patient = await Patient.findById(req.params.id);
    res.render("view_patient", { patient });
});



// Start server
app.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'));
