const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');

const newsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'News must have name'],
      unique: false,
      trim: true,
      maxlength: [200, 'News name must have less or equal 200 characters'],
      minlength: [10, 'News name must have more or equal 10 characters']
    },
    slug: String,
    type: {
      type: String,
      default: 'funny',
      required: [true, 'News type should have name'],
      enum: {
        values: ['funny', 'sadly', 'fantastic', 'sensational', 'dangerously'],
        message:
          'Type is either: funny, sadly, fantastic, dangerously or sensational'
      }
    },
    category: {
      type: String,
      default: 'Other',
      enum: {
        values: [
          'Politics',
          'World News',
          'Business and Finance',
          'Technology',
          'Science',
          'Health',
          'Entertainment',
          'Sports',
          'Environment',
          'Human Interest',
          'Education',
          'Crime and Justice',
          'Lifestyle',
          'Opinion and Editorial',
          'Weather',
          'Other'
        ]
      }
    },
    famousPerson: {
      type: String,
      default: 'Some famous paerson',
      required: [false]
    },
    place: {
      type: String,
      default: 'Some famous place',
      required: [false]
    },
    length: {
      type: Number,
      default: 50
    },
    description: {
      type: String,
      default: ''
    },
    // autor: {
    //   type: String,
    //   default: 'Jon Doe',
    //   required: [true, 'Autor should be selected'],
    //   maxlength: [30, 'News autor must have less or equal 30 characters'],
    //   minlength: [6, 'News autor must have more or equal 6 characters']
    // },
    autor: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    // autors: Array, -- if we want Embedding
    autors: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ],
    imageCover: {
      type: String,
      default: 'default.jpg',
      required: [true, 'A news must have a cover image']
    },
    images: [String],
    isPublic: {
      type: Boolean,
      default: false,
      required: [true, 'Publich checkbox should be selected']
    },
    isActive: {
      type: Boolean,
      default: false,
      required: [true, 'Active checkbox should be selected']
    },
    createdAt: {
      type: Date,
      default: Date.now()
      // select: false
    },
    updatedAt: {
      type: Date,
      default: Date.now()
    },
    ratingsAverage: {
      type: Number,
      required: false,
      default: 0,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    secretNews: {
      type: Boolean,
      default: false
    },
    workflowRunId: {
      type: String
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

// newsSchema.index({ length: 1 });
newsSchema.index({ length: 1, ratingsAverage: -1 });
newsSchema.index({ slug: 1 });

newsSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// Virtual populate
newsSchema.virtual('comments', {
  ref: 'Comment',
  foreignField: 'news',
  localField: '_id'
});

// DOCUMENt MIDDLWARE: runs before .save() and .create()
newsSchema.pre('save', function(next) {
  this.slug = slugify(this.name, {
    lower: true,
    remove: /[*+~.,;()'"!:#$@%^*()|/><`]/g
  });
  next();
});

// EMBEDDING
// newsSchema.pre('save', async function(next) {
//   const autorsPromises = this.autors.map(async id => await User.findById(id));
//   this.autors = await Promise.all(autorsPromises);
//   next();
// });

// newsSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next(next);
// });

// newsSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLAWARE
// newsSchema.post('find', function (doc, next) {
newsSchema.pre(/^find/, function(next) {
  this.find({
    secretNews: { $ne: true }
    // isPublic: { $ne: false },
    // isActive: { $ne: false }
  });
  this.start = Date.now();
  next();
});

newsSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'autor',
    select: '-__v -passwordChangedAt'
  });
  // this.populate({
  //   path: 'autors',
  //   select: '-__v -passwordChangedAt'
  // });
  next();
});

newsSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);

  next();
});

// AGGREGATION MIDDLWARE
newsSchema.post('aggregate', function(next) {
  this.pipeline().unshift({
    $match: { secretNews: { $ne: true } }
  });
  next();
});

const News = mongoose.model('News', newsSchema);

module.exports = News;
