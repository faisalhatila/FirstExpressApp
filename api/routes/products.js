const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
// const upload = multer({ dest : 'uploads/' });

const storage = multer.diskStorage({
    destination : (req, file, cb) => {
        cb(null,'./uploads/')
    },
    filename : (req, file, cb) => {
        cb(null,Date.now() + file.originalname);
    }
})

// const fileFilter = (req, file, cb) => {
//     //reject a file
//     if(file.mimetye === 'image/png' || file.mimetye === 'image/jpg' || file.mimetye === 'image/jpeg') {
//         cb(null,true)
//     }
//     else {
//         cb(new Error('Format Not Supported'),false);
//     }
//     cb(null,false)
// }

const upload = multer({
    storage : storage,
    limits : {
    fileSize : 1024 * 1024 * 5
    },
    // fileFilter : fileFilter,
})

const Product = require('../models/product');

router.get('/',(req,res,next) => {
    Product.find()
    .select('name price _id productImage')
    .exec()
    .then(docs => {
        const response = {
            count : docs.length,
            products : docs.map(doc => {
                return {
                    name : doc.name,
                    price : doc.price,
                    productImage : doc.productImage,
                    _id : doc._id,
                    request : {
                        type : 'GET',
                        url : 'http://loaclhost:5000/products/' + doc._id,
                    }
                }
            })
        }
        // console.log(docs);
        res.status(200).json(response)
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error : err
        })
    });
});

router.get('/:productId',(req,res,next) => {
    const id = req.params.productId;
    Product.findById(id)
    .select('name price _id productImage')
    .exec()
    .then(doc => {
        console.log(doc);
        if(doc) {
            res.status(200).json({
                product : doc,
                request : {
                    type : 'GET',
                    // description : 'GET_ALL_PRODUCTS',
                    url : "http://localhost:5000/products/" + id
                }
            })
        }
        else {
            res.status(404).json({message : 'No valid extry found for provided ID'});
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({error : err})
    });
});

router.patch('/:productId',(req,res,next) => {
    const id = req.params.productId;
    const updateOps = {};
    for(const ops of req.body){
        updateOps[ops.propName] = ops.value;
    }
    Product.update({_id : id}, {$set: updateOps })
        .exec()
        .then(result => {
            // console.log(result);
            res.status(200).json({
                message : 'Product Updated',
                request : {
                    type : 'GET',
                    url : "http://localhost:5000/products/" + id 
                }
            })
        })
        .catch(err =>{
            console.log(err);
            res.status(500).json({
                error : err
            })
        });
});

router.delete('/:productId',(req,res,next) => {
    const id = req.params.productId;
    Product.deleteOne({_id : id})
    .exec()
    .then(result => {
        res.status(200).json({
            message : 'Product Deleted',
            request : {
                type : 'POST',
                url : 'http://localhost:5000/products/' + id,
                body : {name : 'String', price : 'Number'}
            }
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error : err
        })
    })
});

router.post('/',upload.single('productImage'),(req,res,next) => {
    console.log(req.file);
    const product = new Product({
        _id : new mongoose.Types.ObjectId(),
        name: req.body.name,
        price: req.body.price,
        productImage : req.file.path, 
    });
    product
    .save()
    .then(result => {
        console.log(result);
        res.status(201).json({
            message : 'Created Product Successfully',
            createdProduct : {
                _id : result._id,
                name : result.name,
                price : result.price,
                request : {
                    type : 'GET',
                    url : "http://localhost:5000/products" + result._id
                }
            },
        });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error : err
        })
    })
});

module.exports = router;