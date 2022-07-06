const { response } = require('express');
var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')


/* GET users listing. */
router.get('/', function(req, res, next) {

productHelpers.getAllProducts().then((product)=>{

  //console.log(product);
  res.render('admin/view-products',{admin:true,product})


})    


});

//add product

router.get('/add-product',function(req,res){
    res.render('admin/add-product')

    

})



router.post('/add-product',(req,res)=>{
   console.log(req.body);
  // console.log(req.files.Image);
  productHelpers.addProduct(req.body,(insertedId)=>{
    let image=req.files.Image
    image.mv('./public/product-image/'+insertedId+'.jpeg',(err,done)=>{
      if(!err){
        res.render("admin/add-product")
      }
      else{
        console.log(err);
      }
    })

    
  })

})


router.get('/delete-product/:id',(req,res)=>{

let proId=req.params.id
//console.log(proId);
 //console.log(req.query.name);
productHelpers.deleteProduct(proId).then((response)=>{

 // console.log(response);
  res.redirect('/admin')
})

})

//edit product
router.get('/edit-product/:id',async (req,res)=>{

let product=await productHelpers.getProductDetails(req.params.id)
//console.log(product,'.............................');        


  res.render('admin/edit-product',{product})
})

router.post('/edit-product/:id',(req,res)=>{
 // console.log(req.params.id);
   let id=req.params.id
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
      let image=req.files.Image
      image.mv('./public/product-image/'+id+'.jpeg')

      }
  })

})


// router.post('add-product',(req,res)=>{
//   let image=req.files.image
//   productHelper.addProduct(req.body).then((res)=>{
//     console.log(res);
//     image.mv('./public/product-image/'+res+'.jpeg',(err,done)=>{

//       if(!err){
//         res.render("admin/add-product")
//       }
//   })
// })
// })


// router.post('/add-product',(req,res,next)=>{
//   let image=req.files.Image
//     productHelper.addProduct(req.body).then((response)=>{
//       console.log(response,"================");
//       image.mv('./public/images/'+response+".jpg",(err,done)=>{
//         if(!err){
//           res.render("admin/add-product")
//         }
//       })
//     })
    
  
    
// })


module.exports = router;

