// Seting up the libraries:
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const session= require('express-session');
const bcrypt= require('bcrypt-nodejs');
const fileUpload = require('express-fileupload');

// Setting up the link to the database.
const sequelize= new Sequelize('ansaar_app', process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, {
	host: 'localhost',
	dialect: 'postgres',
	define: {
		timestamps: true
	}
})

app.use('/', bodyParser());

app.set('views', './');
app.set('view engine', 'pug');
app.use(express.static("public"));
app.use(fileUpload());

// Setting up the tables
var Student = sequelize.define('student', {
	firstname: Sequelize.STRING,
	lastname: Sequelize.STRING,
	birthdate: Sequelize.STRING,
	gender: Sequelize.STRING,
	school: Sequelize.STRING,
	level: Sequelize.STRING,
	book: Sequelize.BOOLEAN,
	approved: Sequelize.BOOLEAN
});

var Parent = sequelize.define('parent', {
	firstname: Sequelize.STRING,
	lastname: Sequelize.STRING,
	email: Sequelize.STRING,
	birthdate: Sequelize.STRING,
	gender: Sequelize.STRING,
	password: Sequelize.STRING,
	phoneNumber: Sequelize.STRING
});

var Teacher = sequelize.define('teacher', {
	firstname: Sequelize.STRING,
	lastname: Sequelize.STRING,
	email: Sequelize.STRING,
	birthdate: Sequelize.STRING,
	gender: Sequelize.STRING,
	password: Sequelize.STRING,
	phoneNumber: Sequelize.STRING
});

var Class= sequelize.define('class', {
	className: Sequelize.STRING,
})

var Attendance= sequelize.define('attendance', {
	date: Sequelize.DATE,
	attendance: Sequelize.STRING
})

sequelize.sync({force: false}) //Change false to true to wipe clean the whole database.

// Setting up the model by linking the tables to each other
Student.belongsTo(Class);
Class.hasMany(Student);
Student.belongsTo(Parent);
Parent.hasMany(Student);
Teacher.belongsTo(Class);
Class.hasOne(Teacher);

// Creates session when user logs in
app.use(session({
	secret: `${process.env.SECRET_SESSION}`,
	resave: true,
	saveUninitialized: false
}));

// Goes to the index page, which is the homepage
app.get('/',  (req,res)=>{
	res.render('public/views/index', {
		// You can also use req.session.message so message won't show in the browser
		message: req.query.message,
		user: req.session.user
	});
});

app.get('/register', (req,res)=>{
	res.render('public/views/register')
})

app.post('/register', (req,res)=>{
	Parent.sync()
		.then(()=>{
			Parent.findOne({
				where: {
					email: req.body.email
				}
			})
			.then((user)=> {
				if(user!== null && req.body.email === user.email) {
					res.redirect('/?message=' + encodeURIComponent("Gebruiker is al geregistreerd."))
					return
				} else {
					bcrypt.hash(req.body.password, null, null, (err,hash)=>{
						if (err) {
							throw err
						}
						console.log(req.body.birthdate)
						Parent.create({
							firstname: req.body.firstname,
							lastname: req.body.lastname,
							birthdate: req.body.birthdate,
							gender: req.body.gender,
							email: req.body.email,
							phoneNumber: req.body.phoneNumber,
							password: hash
						})
						.then(()=> {
							res.redirect('/?message=' + encodeURIComponent("Succesvol geregistreerd!"))
						})
					})
				}
			})
		})
})

app.get('/login', (req,res)=>{
	res.render('public/views/login')
})

app.post('/login', (req, res) => {
	if(req.body.email.length ===0) {
		res.redirect('/?message=' + encodeURIComponent("Invalid email"));
		return;
	}
	if(req.body.password.length ===0) {
		res.redirect('/?message=' + encodeURIComponent("Invalid password"));
		return;
	}
	Parent.findOne({
		where: {
			email:req.body.email
		}
	}).then((user) => { //This part needs fixing, when the email is not in the database it should not pass on, it will yield errors.
		if(user === null) {
        	res.redirect('/?message=' + encodeURIComponent("Does not exist!"));
			return;
		}
		bcrypt.compare(req.body.password, user.password, (err, data)=>{
			if (err) {
					throw err;
			} else {
				if(user !== null && data === true) {
					req.session.user = user
					res.redirect('/profile');
				} else {
					res.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
				}
			}
		});
	}), (error)=> {
		res.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
	};
});

app.get('/profile', (req, res)=> {
    var user = req.session.user;
    if (user === undefined) {
        res.redirect('/?message=' + encodeURIComponent("Please log in to view your profile."));
        return
    } 
	res.render('public/views/profile', {
    	user: user
	});
});

app.get('/logout', (req, res)=> {
    req.session.destroy(function(error) {
        if(error) {
            throw error;
        }
        res.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
    })
});

var server = app.listen(3000, function() {
  console.log('The server is running at http//:localhost:' + server.address().port)
});