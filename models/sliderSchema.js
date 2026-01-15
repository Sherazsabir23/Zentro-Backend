const mongoose =  require("mongoose");

const sliderSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
}, { timestamps: true });

const Slider = mongoose.model("Slider", sliderSchema);
module.exports =Slider;
