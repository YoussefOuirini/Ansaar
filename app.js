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

Class.sync({force: false})
	.then(()=>{
		Class.findOne({
			where: {
				className: "Klas 1 Aboe Bakr"
			}
		}).then((klass)=>{
			if(klass===null) {
				return Class.create({
					className: "Klas 1 Aboe Bakr"
				})
			}
			return
		}).then().catch(error=>{console.log(error)})
	})

Teacher.sync({force: false})
	.then(()=>{
		Teacher.findOne({
			where: {
				email: "youssefouirini@gmail.com"
			}
		}).then((teacher)=>{
			if (teacher === null) {
				bcrypt.hash("pizza", null, null, (err,hash)=>{
					if (err) {
						throw err
					}
					return Teacher.create({
						firstname: "Youssef",
						lastname: "Ouirini",
						email: "youssefouirini@gmail.com",
						birthdate: "18-06-1992",
						gender: "male",
						password: hash,
						phoneNumber: "0684132765",
						classId: '1'
					})
				});
			} 
			return
		}).then().catch(error=>{console.log(error)})
	})

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
	}).then((user) => {
		Teacher.findOne({
			where: {
				email: req.body.email
			}
		}).then((teacher)=>{
			if ((teacher!==null)) {
				bcrypt.compare(req.body.password, teacher.password, (err, data)=>{
					if (err) {
						throw err;
					} else {
						if(teacher !== null && data== true) {
							req.session.user = teacher;
							res.redirect('/teacher');
						} else {
							res.redirect('/?message=' + encodeURIComponent("Invalid email or password."))
						}
					}
				})
			} else {
				if(user === null) {
		        	res.redirect('/?message=' + encodeURIComponent("Does not exist!"));
					return;
				}
				bcrypt.compare(req.body.password, user.password, (err, data)=>{
					if (err) {
							throw err;
					} else {
						if(user !== null && data === true) {
							req.session.user = user;
							res.redirect('/profile');
						} else {
							res.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
						}
					}
				});
			}
		})
	}), (error)=> {
		res.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
	};
});

app.get('/teacher', (req,res)=>{
	var teacher= req.session.user;
	 if (teacher === undefined) {
        res.redirect('/?message=' + encodeURIComponent("Please log in to view your profile."));
        return
    } 
	Teacher.findOne({
			where: {
				email: teacher.email
			}
		}).then((teacher)=>{
			Student.findAll({
				include: [{model: Parent, as: 'parent'}],
				where: {classId: teacher.classId}
			}).then((students)=>{
				Student.findAll({
					where: {
						classId: null
					}
				}).then((intakes)=>{
					Class.findAll()
						.then((klassen)=>{
							res.render('public/views/teacher', {
								teacher: teacher,
								students: students,
								intakes: intakes,
								klassen: klassen
							})
						})
				})
			})
		})
});

app.get('/profile', (req, res)=> {
    var user = req.session.user;
    if (user === undefined) {
        res.redirect('/?message=' + encodeURIComponent("Please log in to view your profile."));
        return
    } 
    Student.findAll({
    	where: {
    		parentId: user.id
    	}
    }).then((students)=>{
    	res.render('public/views/profile', {
    		user: user,
    		students: students
		});
    })
});

app.post('/kindInschrijven', (req,res)=>{
	Student.sync()
		.then(()=>{
			Student.findOne({
				where:{
					firstname: req.body.firstname,
					lastname: req.body.lastname
				}
			}).then((student)=>{
				if(student!==null && req.body.firstname === student.firstname && req.body.lastname === student.lastname) {
					res.redirect('/?message=' + encodeURIComponent("Uw kind is al ingeschreven."));
					return
				} else {
					Student.sync()
						.then(()=>{
							return Student.create({
								firstname: req.body.firstname,
								lastname: req.body.lastname,
								birthdate: req.body.birthdate,
								gender: req.body.gender,
								school: req.body.school,
								level: req.body.level,
								parentId: req.body.parentId
							})
						})
						.then(()=>{
							res.redirect('/profile');
						})
				}
			})
		})
})

app.post('/intake', (req,res)=>{
	Student.update({
		classId: req.body.classId
		},{
		where: {
			id: req.body.id
		}
	}).then(()=>{
		res.redirect('/teacher')
	})
})

app.post('/teacher', (req,res)=>{
	Teacher.sync({force: false})
		.then(()=>{
		Teacher.findOne({
			where: {
				email: req.body.email
			}
		}).then((teacher)=>{
			if (teacher !== null && teacher.email===req.body.email) {
				res.redirect('/?message=' + encodeURIComponent("Email van de leraar is al bezet"))
				return
			} else {
				bcrypt.hash("pizza", null, null, (err,hash)=>{
					if (err) {
						throw err
					}
					return Teacher.create({
						firstname: req.body.firstname,
						lastname: req.body.lastname,
						email: req.body.email,
						birthdate: req.body.birthdate,
						gender: req.body.gender,
						password: hash,
						phoneNumber: req.body.phoneNumber,
						classId: req.body.classId
					})
				});
			}
		}).then().catch(error=>{console.log(error)})
	})
})

app.post('/klassen', (req,res)=>{
	Class.findOne({
		where: {
			className: req.body.className
		}
	}).then((klas)=>{
		if(klas!==null) {
			res.redirect('/?message=' + encodeURIComponent("Klasnaam is al bezet"))
		} else {
			Class.create({
				className: req.body.className
			}).then(()=>{
				res.redirect('/teacher')
			}).then().catch(error=>{console.log(error)})
		}
	})
})

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