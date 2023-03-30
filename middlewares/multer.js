import multer from "multer";

const storage = multer.memoryStorage();

// we pass storage option inside and pass single as we want single file
// name shoul be same as req.file
// from req.file we will get this file
const singleUpload = multer({storage}).single("file");

export default singleUpload;