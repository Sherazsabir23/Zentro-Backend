const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// 1. Cloudinary credentials configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Cloudinary Storage config (Yeh local storage ko replace karega)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "zentro-products", // Cloudinary dashboard me is naam ka folder ban jayega
    allowed_formats: ["jpeg", "png", "jpg", "webp"], // Jo formats aap allow karna chahte hain
    public_id: (req, file) => {
      // Yeh aapki file ka unique naam banayega jaise pehle ban raha tha
      const uniqueName = Date.now() + "-" + file.originalname.split('.')[0];
      return uniqueName;
    },
  },
});

// 3. Filter for images only (Aapka purana filter thode badlav ke sath)
const fileFilter = function (req, file, cb) {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, JPG, WEBP and PNG are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

module.exports = upload;
