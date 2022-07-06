var express = require("express");
var router = express.Router();
const userHelpers = require("../helpers/user-helpers");

const productHelpers = require("../helpers/product-helpers");
//const userHelpers = require('../helpers/user-helpers');
const { response } = require("express");
const session = require("express-session");
const Razorpay = require('razorpay');

//middlleware

const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};
//middleware admin
const verifyLoginadmin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/login");
  }
};


/* GET home page. */

router.get("/", async function (req, res, next) {
  let user = req.session.user;

  //console.log(user);

  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }

  productHelpers.getAllProducts().then((product) => {
    //new add

    res.render("user/view-products", { product, user, cartCount });
  });
});

//user login 

router.get("/login", (req, res, next) => {
  if (req.session.user) {

    verifyLogin;
    res.redirect("/");
  } else {
    res.render("user/login", { loginErr: req.session.userLoginErr });
    req.session.userLoginErr = false;
  }
});

router.post("/login",async(req, res, next) => {


userHelpers.doLogin(req.body).then((response) => {
 
  console.log(response,"appi call reached");
    if(response.status) {
      req.session.user = response.user;
      req.session.user.loggedIn = true;

      console.log(req.session.user.loggedIn, 'fron login post success');
     res.redirect("/");
    } else {
      req.session.userLoginErr = "invalid username or password";
      res.redirect("/login");
    }
  });
});
//admin login

router.get("/admin/login", (req, res, next) => {
  if (req.session.admin) {

    verifyLoginadmin;
    res.redirect("/");
  } else {
    res.render("admin/login", { loginErr: req.session.adminLoginErr });
    req.session.adminLoginErr = false;
  }

});

router.post("/admin/login",async(req, res, next) => {


  userHelpers.doLogin(req.body).then((response) => {
   
    console.log(response,"appi call reached");
      if(response.status) {
        req.session.admin = response.admin;
        req.session.admin.loggedIn = true;
  
        console.log(req.session.admin.loggedIn, 'fron login post success');
       res.redirect("/");
      } else {
        req.session.adminLoginErr = "invalid username or password";
        res.redirect("admin/login");
      }
    });
  });



//signup

router.get("/signup", (req, res, next) => {
  res.render("user/signup");
});

router.post("/signup", (req, res, next) => {
  userHelpers.doSignup(req.body).then((response) => {
    // console.log(response);
    req.session.user = response;
    req.session.user.loggedIn = true;
    redirect("/");
  });
});

//logout

router.get("/logout", (req, res) => {
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect("/login");
});

//cart
router.get("/cart", verifyLogin, async (req, res, next) => {

 
    let totalvalue = await userHelpers.getTotalAmount(req.session.user._id);

  let products = await userHelpers.getCartProducts(req.session.user._id);
  //console.log(totalvalue,'totaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaal');
  //  console.log(products);
  res.render("user/cart", { products, user: req.session.user._id, totalvalue });
});

router.get("/add-to-cart/:id", (req, res) => {
  console.log("api call");
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    //res.redirect('/')
    res.json({ status: true });
    console.log(req.params.id, "userjs.122");
  });
});

router.post("/change-product-quantity", (req, res, next) => {
  //console.log(req.body,'this is req.body');
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user);

    res.json(response);
  });
});

router.get("/place-order", verifyLogin, async (req, res, next) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id);
  res.render("user/place-order", { total, user: req.session.user });
});
router.post("/place-order", async (req, res) => {
  let products = await userHelpers.getCartProductList(req.body.userId);
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId);
  userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
    //resolve(req.body,products,totalPrice)
  //res.json({status:true})
  if('cod'==='on'){
    res.json({codSuccess:true });
  }
  else{

    userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
res.json(response)
    })
  }
  
    //res.json(response)
  });

  console.log(req.body, "req.body");
});

router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
  console.log(user,'userrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr');
})
router.get('/orders',async(req,res)=>{
  console.log(req.body);
  let orders=await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders})
})
router.get('/view-order-products/:id',async(req,res)=>{
  let products=await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products',{user:session.user,products})
})


router.post('/verify-payment',(req,res)=>{
  console.log(req.body,'verify payment');

  userHelpers.verifyPayment(req.body).then(()=>{
  userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
    res.json({status:true})
    console.log('payment success');


  })
    
  }).catch((err)=>{
    console.log(err);
    res.json({status:false,errMsg:'payment failed'})
  })
})


module.exports = router;
