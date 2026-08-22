const mongoose = require('mongoose');

const localizedName = new mongoose.Schema(
  {
    bn: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const topicSchema = new mongoose.Schema(
  {
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true, index: true },
    name: { type: localizedName, required: true },
    order: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

topicSchema.index({ chapterId: 1, order: 1 }, { unique: true });
module.exports = mongoose.model('Topic', topicSchema);
