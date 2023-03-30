import DataUriParser from "datauri/parser.js";
import path from "path";

const getDataUri = (file) => {
    // to convert the file to uri
    const parser = new DataUriParser();
    // get file name
    const extName = path.extname(file.originalname).toString();

    // it want file name and file buffer
    return parser.format(extName,file.buffer);
}

export default getDataUri;