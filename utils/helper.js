const fs = require("fs");
const {
  supportedMimesImg,
  supportedMimesExcel,
} = require("../resources/mimeTypes");
const imageToBase64 = require("image-to-base64");

const imageValidator = (size, mime) => {
  if (bytesToMb(size) > 1) {
    return "Image size must be less than 1 MB";
  } else if (!supportedMimesImg.includes(mime)) {
    return "Image must be type of png,jpg,jpeg,svg,wrbp,gif...";
  }
  return null;
};

const excelValidator = (size, mime) => {
  if (bytesToMb(size) > 1) {
    return "File size must be less than 1 MB";
  } else if (!supportedMimesExcel.includes(mime)) {
    return "File must be type of xlsx";
  }
  return null;
};

const bytesToMb = (bytes) => {
  return bytes / (1024 * 1024);
};

const getImgUrl = (imgName) => {
  return `${process.env.APP_URL}/uploads/${imgName}`;
};

const deleteFile = (fileName) => {
  const path = process.cwd() + "/public/" + fileName;

  if (fs.existsSync(path)) {
    try {
      fs.unlinkSync(path);
    } catch (error) {
      console.error("Failed to delete file:", error.message);
    }
  }
};

const convertImageToBase64 = async (imagePath, mimetype) => {
  try {
    const base64Data = await imageToBase64(imagePath); // Convert image to Base64

    // Return Base64 string with MIME type prepended
    return `data:${mimetype};base64,${base64Data}`;
  } catch (error) {
    throw new Error("Failed to read image file");
  }
};

const uploadFile = (file, uploadPath) => {
  return new Promise((resolve, reject) => {
    file.mv(uploadPath, (err) => {
      if (err) {
        reject("Failed to upload the file.");
      } else {
        resolve();
      }
    });
  });
};

module.exports = {
  imageValidator,
  excelValidator,
  bytesToMb,
  getImgUrl,
  uploadFile,
  deleteFile,
  convertImageToBase64,
};
