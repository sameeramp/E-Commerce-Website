// var db=require('../config/connection')


// module.exports={


// addProduct:(product)=>{
//     return new Promise(async(resolve,reject)=>{

//      const data = await db.get().collection('product').insertOne(product)
//                  if(data){
//                      resolve(data.insertedId)
//               }
        
//     })
// }


// }

// var db=require('../config/connection')

// module.exports={
//     addproduct:(product)=>{
//         return new Promise (async,(res,rej)=>{
//             const data= await db.get().collection('products').insertOne(product)
//             if(data){
//                 res(data.insertedId)
//             }
//         })
//     }
// }


var db=require('../config/connection')

var collection=require('../config/collections');

var objectId=require('mongodb').ObjectId
//const { response } = require('express');



module.exports={
    addProduct:(product,callback)=>{
        product.prize = parseInt(product.prize)
       //console.log(product,"--------------");

      db.get().collection('products').insertOne(product).then((data)=>{
         
         // console.log(data);
           
          callback(data.insertedId)
      })

    },

    getAllProducts:()=>{          


        return new Promise(async(resolve,reject)=>{

            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()

            resolve(products)

            //console.log(products,'products===========================');
        })
    },

    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
           // console.log(prodId);
            //console.log(objectId(prodId));
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(prodId)}).then((response)=>{
              //console.log(response);
                resolve(response)
            })
        })
    },
    getProductDetails:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(prodId)}).then((product)=>{
                resolve(product)
                // console.log(product,'edittttttttt');
                // console.log(product.prize,'prizeeeeeeeeeeeeeeeeeeeeeeeeee');

            })
        })
    },

    updateProduct:(proId,proDetails)=>{
        proDetails.prize = parseInt(proDetails.prize)


        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
             $set:{
                product_name:proDetails.product_name,
                product_description:proDetails.product_description,
                 prize:proDetails.prize
             }

            }).then((response)=>{
                resolve()
                 //console.log(response,'updateeeeeeeeeeeeeeeeee');
                console.log(proDetails.prize,'prizeeeeeeeeeeeeeeee');
            })
        })
    }
        
}

