const mongoose = require('mongoose');

const localizedName = new mongoose.Schema(
  {
    bn: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const chapterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    name: { type: localizedName, required: true },
    order: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

chapterSchema.index({ order: 1 }, { unique: true });
module.exports = mongoose.model('Chapter', chapterSchema);
