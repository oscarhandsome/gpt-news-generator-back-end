const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    newsId: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'News'
      }
    ],
    history: {
      type: Array,
      default: []
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      immutable: true
    },
    updatedAt: {
      type: Date,
      default: Date.now()
    }
  },
  {
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret._id; // return Id instead _id
        delete ret.__v;
      }
    },
    toObject: { virtuals: true }
  }
);

const History = mongoose.model('History', historySchema);

module.exports = History;
