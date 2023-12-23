const mongoose = require('mongoose');
const News = require('./newsModel');

const commentSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      required: [true, 'Comment can not be empty'],
      trim: true
      // maxlength: [250, 'Comment name must have less or equal 250 characters'],
      // minlength: [10, 'Comment name must have more or equal 10 characters']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    news: {
      type: mongoose.Schema.ObjectId,
      ref: 'News',
      required: [true, 'Comment must belong to a news.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Comment must belong to a user.']
    }
  },
  // {
  //   toJSON: { virtuals: true },
  //   toObject: { virtuals: true }
  // },
  {
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret._id; // return Id instead _id
        delete ret.__v;
      }
    },
    toObject: { virtuals: true }
    // versionKey: false
  }
);

// Prevent duplicating comments
commentSchema.index({ news: 1, user: 1 }, { unique: true });

commentSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'news',
  //   select: 'name'
  // }).populate({
  //   path: 'autor',
  //   select: 'name photo'
  // });
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

commentSchema.statics.calcAverageRatings = async function(newsId) {
  const stats = await this.aggregate([
    {
      $match: {
        news: newsId
      }
    },
    {
      $group: {
        _id: '$news',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  // console.log('stats', stats);

  if (stats.length > 0) {
    await News.findByIdAndUpdate(newsId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await News.findByIdAndUpdate(newsId, {
      ratingsQuantity: 0,
      ratingsAverage: 0
    });
  }
};

commentSchema.post('save', function() {
  // this points to current comment
  this.constructor.calcAverageRatings(this.news); // - acces with constructor to current comment
});

// findByIdAndUpdate - for this events we have query middleware
// findByIdAndDelete

// middlware hooks
commentSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne(); // - this here current query
  // console.log('this.r', this.r);
  next();
});

commentSchema.post(/^findOneAnd/, async function() {
  // await this.findOne(); does NOT work here, query has already executed
  this.r.constructor.calcAverageRatings(this.r.news);
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
