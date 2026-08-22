const mongoose = require('mongoose');

const localizedName = new mongoose.Schema(
  {
    bn: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const subtopicSchema = new mongoose.Schema(
  {
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true, index: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    name: { type: localizedName, required: true },
    order: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

subtopicSchema.index({ topicId: 1, order: 1 }, { unique: true });
subtopicSchema.index({ chapterId: 1, topicId: 1 });
module.exports = mongoose.model('Subtopic', subtopicSchema);
