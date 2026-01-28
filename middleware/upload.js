import multer from 'multer'

const upload = multer({
    // destination folder- uploaded files will be stores, multer automatically created a tempoarary file here
    dest:"uploads/",
    fileFilter: (req, file, cb) => {
        if(!file.originalname.endsWith("csv")){
            // if file is not CSV reject it, first argument error
            cb(new Error("Only CSV files are allowed")) //cb- callback
        }

        // if file valid, first argument null, second argument true
        cb(null, true)
    }
})

export default upload