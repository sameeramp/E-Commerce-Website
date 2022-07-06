var db = require("../config/connection");

var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const collections = require("../config/collections");
const { response } = require("express");

var objectId = require("mongodb").ObjectId;
const Razorpay = require("razorpay");
const { resolve } = require("path");
var instance = new Razorpay({
  key_id: "rzp_test_yIuy0HVv1L9RRS",
  key_secret: "M7HIBjT0MvoCUbP9DLIof1IW",
});
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.Password = await bcrypt.hash(userData.Password, 10);
      db.get()
        .collection(collections.USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          db.get()
            .collection(collections.USER_COLLECTION)
            .findOne(data._id)
            .then((data) => {
              console.log(data, 'its dataaaaaaaa');
              resolve(data);
            });
        });
    });
  },

  doLogin: (userData) => {
    // return new Promise(async (resolve,reject)=>{
    //   resolve({success:true})
    // })

    return new Promise(async (resolve, reject) => {
      //console.log(userData,'inside promise');
      let loginStatus = false;
      let response = {};

      let user = await db
        .get()
        .collection(collections.USER_COLLECTION)
        .findOne({ Email: userData.Email });
      console.log(user, "userr");
      if (user) {
        //console.log(user,'if');
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          console.log(status, "status");
          if (status) {
            console.log("login success");
            response.user = user;
            response.status = true;

            resolve(response);
          } else {
            console.log("login faild");
            resolve({ status: false });
          }
        });
      } else {
        console.log("user doesnt exist");
        resolve({ status: false });
      }
    });
  },

  addToCart: (proId, userId) => {
    let proObj = {
      item: objectId(proId),
      quantity: 1,
      //new add
    };

    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == proId
        );
        // console.log(proExist);
        if (proExist != -1) {
          db.get()
            .collection(collections.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId), "products.item": objectId(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collections.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collections.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },
  getCartProducts: (userId) => {
    //console.log(userId,'userid');

    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
              //prize:"$products.prize"
            },
          },
          {
            $lookup: {
              from: collections.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },

          // {
          //   $lookup:{
          //     from:collections.PRODUCT_COLLECTION,
          //     let:{proList:'$products'},
          //     pipeline:[
          //       {
          //         $match:{
          //           $expr:{
          //             $in:['$_id',"$$proList"]
          //           }
          //         }
          //       }
          //     ],
          //     as:'cartItems'
          //   }
          // }
        ])
        .toArray();
      // console.log(cartItems);
      // console.log(cartItems[0].cartItems, "cart items");
      resolve(cartItems);
    });
  },

  getCartCount: (userid) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: objectId(userid) });
      if (cart) {
        count = cart.products.length;
      }

      resolve(count);
    });
  },
  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);
    //console.log(req.body,'this is rq.bdyyyyyy');
    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collections.CART_COLLECTION)
          .updateOne(
            { _id: objectId(details.cart) },

            {
              $pull: { products: { item: objectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collections.CART_COLLECTION)
          .updateOne(
            {
              _id: objectId(details.cart),
              "products.item": objectId(details.product),
            },

            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },
  getTotalAmount: (userId) => {
    userId.quantity = parseInt(userId.quantity);
    userId.prize = parseInt(userId.prize);

    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
              //prize:"$products.prize"
            },
          },
          {
            $lookup: {
              from: collections.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,

              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.prize"] } },
            },
          },
        ])
        .toArray();
     // console.log(total[0].total, "total");
      resolve(total[0].total);
    });
  },

  placeOrder: (order, products, total) => {
    return new Promise((resolve, reject) => {
      //console.log(order, products, total);
      let status = order.cod == "on" ? "placed" : "pending";
      let orderObj = {
        deliveryDetails: {
          address1: order.address1,
          address2: order.address2,
          city: order.city,
          zip: order.zip,
        },
        userId: objectId(order.userId),
        cod: order.cod,
        products: products,
        totalAmount: total,
        status: status,
        date: new Date(),
      };

      db.get()
        .collection(collections.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collections.CART_COLLECTION)
            .deleteOne({ user: objectId(order.userId) });

          resolve(response.insertedId);
          // console.log(response,'opssssssssssssss');
          console.log(response.insertedId,'orderobj');
        });
    });
  },
  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      resolve(cart.products);
    });
  },
  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collections.ORDER_COLLECTION)
        .find({ userId: objectId(userId) })
        .toArray();
      resolve(orders);
      return(orders)

    console.log(orders,'ordersssssssssssssssss');
    });
  },
  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db
        .get()
        .collection(collections.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
              //prize:"$products.prize"
            },
          },
          {
            $lookup: {
              from: collections.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
     // console.log(orderItems);
      resolve(orderItems);
    });
  },
  generateRazorpay: (orderId, total) => {
    console.log(orderId,total,'orderidddd');
    return new Promise((resolve, reject) => {
      var options={
        amount:total*100,
        currency:"INR",
        receipt:orderId.toString(),
      };
      instance.orders.create(options,function(err,order){
        console.log("new order",order);
        //console.log(options.receipt);
         resolve(order)
      })
      
    });
  },
  
  verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
       const crypto =require('crypto');
      //  const {
      //   createHmac
      // } =  import('node:crypto');
      
      
       let hmac = crypto.createHmac('sha256', 'M7HIBjT0MvoCUbP9DLIof1IW');
      
      hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
     hmac=hmac.digest('hex')
      if(hmac==details['payment[razorpay_signature]']){
        resolve()
      }else{
        reject()
      }
      // console.log(hmac.digest('hex'));
    })
  },
  changePaymentStatus:(orderId)=>{
    return new Promise((resolve,reject)=>{

      db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
      {
        $set:{
          status:'placed'
        }
      }
    ).then(()=>{
        resolve()
      })
    })

    
   
  }
 

};
