var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var exphbs = require('express-handlebars');
var fs = require('fs')

//file upload
const fileUpload = require('express-fileupload');

//db

var db=require('./config/connection')
//session
var session = require('express-session')


const Handlebars = require('handlebars')
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access')

// Newly Added Files
var { create } = require( 'express-handlebars' );




var adminRouter = require('./routes/admin');
var userRouter = require('./routes/user');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

const hbs = exphbs.create({
  layoutsDir: `${__dirname}/views/layouts`,
  extname : 'hbs',
  defaultLayout: 'layout',
  partialsDir: `${__dirname}/views/partials`,
     handlebars: allowInsecurePrototypeAccess(Handlebars) 

 });


app.engine('hbs', hbs.engine);







app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//img
app.use(express.static("images"));

app.use(fileUpload());
//session

app.use(session({secret:'key',cookie:{maxAge:60000}}))

app.use(function(req,res,next){
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next()

})
//db
db.connect((err)=>{
  if (err)console.log('connection error'+err);
  else console.log('database connected successfully');
})

app.use('/', userRouter);
app.use('/admin', adminRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
