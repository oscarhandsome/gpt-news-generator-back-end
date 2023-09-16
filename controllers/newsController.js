const multer = require('multer');
const sharp = require('sharp');
// const fs = require('fs');
const News = require('./../models/newsModel');
const Booking = require('./../models/bookingModel');
const Subscription = require('./../models/subscriptionModel');
// const APIFeatures = require('../utils/apiFeatures');
const openai = require('../controllers/openAIController');
const leapai = require('../controllers/leapAIConroller');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multiFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('No an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multiFilter
});

exports.uploadNewsImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

// upload.single('image'); req.file
// upload.array('images', 5); req.files

exports.resizeNewsImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);
  // console.log(req.body);
  if (!req.files || !req.files.imageCover || !req.files.images) return next();

  // 1) Cover image
  // const imageCoverFilename = `news-${req.params.id}-${Date.now()}-cover.jpeg`;
  req.body.imageCover = `news-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(600, 400)
    .toFormat('jpeg')
    .jpeg({
      quality: 60
    })
    .toFile(`public/img/news/${req.body.imageCover}`);
  // .toFile(`public/img/news/${imageCoverFilename}`);
  // req.body.imageCover = imageCoverFilename;

  // 2) Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `news-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(600, 400)
        .toFormat('jpeg')
        .jpeg({
          quality: 60
        })
        .toFile(`public/img/news/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

exports.aliasBestNews = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'length';
  req.query.fields = 'name,famousPerson';
  next();
};

// exports.getAllNews = catchAsync(async (req, res, next) => {
//   // EXECUTE QUERY
//   const features = new APIFeatures(News.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const news = await features.query;

//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.requestTime,
//     results: news.length,
//     data: {
//       news
//     }
//   });
// });

// exports.getNews = catchAsync(async (req, res, next) => {
//   // const news = await News.findById(req.params.id).populate({
//   //   path: 'autors',
//   //   select: '-__v -passwordChangedAt'
//   // }); - moved to model
//   // News.findOne({_id: req.params.id});
//   const news = await News.findById(req.params.id).populate('comments');

//   if (!news) {
//     return next(new AppError('No news found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       news
//     }
//   });
// });

exports.generateOpenAiLeapAi = catchAsync(async (req, res, next) => {
  // TODO move requests here
  const { type, famousPerson, place, length } = req.body;
  // const prompt = `Imagine 3 random words corresponding to these points: famous man or women name and surname, some place name on a earth or some popular event, any verb for a action`;
  const openaiResponse = await openai.chat([
    {
      role: openai.roles.ASSISTANT,
      content: `Generate ${type} news with ${famousPerson} at ${place} place with maximal length ${length} words`
    }
  ]);

  req.body.description = openaiResponse.content;

  // Generate Image
  // const result = await leapai.generate.generateImage({
  //   prompt: `${req.body[0].name}`
  // });
  const { data, error } = await leapai.generate.generateImage({
    modelId: 'eab32df0-de26-4b83-a908-a83f3015e971',
    // prompt: `8k portrait of an ${famousPerson} as a jedi, star wars revenge of the sith movie scene style, studio photography, volumetric lighting, smiling, realistic, 35mm, expressive, iconic, 8k concept art, photorealistic, high detail`,
    // prompt: `8k portrait of a classic scene from a ${famousPerson} at ${place} featuring a gunslinger in a dusty desert town, high noon, sun directly overhead, photorealistic, highly detailed`
    prompt: `8k portrait of an enchanting, highly detailed, photorealistic, image of a ${
      openaiResponse.content
    } in a magical ${place}, surrounded by sparkling lights and vibrant flora, captured in soft, dreamy lighting`,
    // prompt: response.content,
    // negativePrompt: 'blurry, low quality',
    negativePrompt:
      '(deformed iris, deformed pupils, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, anime:1.4), text, close up, cropped, out of frame, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck',
    numberOfImages: 1,
    width: 512,
    height: 512,
    steps: 60,
    strength: 7
  });

  if (error) return next(new AppError(error.message, error.statusCode));
  if (data) {
    console.log(data);
    // Print the first image's uri
    // console.log(data.images[0].uri);
    req.body.imageCover = data.images[0].uri;
    // req.body.images = data.images.map(img => img.uri);
  }

  next();
});

exports.setUserCreatorId = (req, res, next) => {
  if (!req.body.user) req.body.autor = req.user.id;
  next();
};

exports.checkSubscriptionAcceess = catchAsync(async (req, res, next) => {
  const news = await News.find({ autor: req.user.id });
  const bookings = await Booking.find({ user: req.user.id });
  const subscriptionIds = bookings.map(el => el.subscription);
  const subscriptions = await Subscription.find({
    _id: { $in: subscriptionIds }
  });
  if (!subscriptions.length)
    return next(new AppError('Subscription not exist!', 402));
  if (subscriptions[0].allowedRequests < news.length)
    return next(new AppError('Quantity of allowed requests is over', 402));
  if (bookings[0].expiresAt < Date.now())
    return next(new AppError('Subsription is over', 402));

  req.allowedRequests = subscriptions[0].allowedRequests;
  req.currentCountNews = news.length;

  next();
});

exports.createNews = catchAsync(async (req, res, next) => {
  // add into db
  const newNews = await News.create(req.body);

  res.status(202).json({
    status: 'success',
    data: {
      news: newNews
    }
  });
  // try {
  //   console.log(req.body);
  //   const response = await openai.chat(
  //     `Generate news by this prompt: ${req.body.name}`
  //   );
  //   console.log('response', response);
  //   const newNews = await News.create(req.body);

  //   res.status(202).json({
  //     status: 'success',
  //     data: {
  //       news: newNews
  //     }
  //   });
  // } catch (err) {
  //   res.status(400).json({
  //     status: 'fail',
  //     data: err
  //   });
  // }
});

// exports.updateNews = catchAsync(async (req, res, next) => {
//   const news = await News.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true
//   });

//   if (!news) {
//     return next(new AppError('No news found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       news
//     }
//   });
// });

exports.getAllNews = factory.getAll(News);
// exports.getNews = factory.getOne(News, {
exports.getNews = factory.getOneBySlug(News, {
  path: 'comments',
  select: '-__v -passwordChangedAt'
});
exports.updateNews = factory.updateOne(News);
exports.deleteNews = factory.deleteOne(News);
// exports.deleteNews = catchAsync(async (req, res, next) => {
//   const news = await News.findByIdAndDelete(req.params.id);

//   if (!news) {
//     return next(new AppError('No news found with that ID', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null
//   });
// });

exports.getNewsStats = catchAsync(async (req, res, next) => {
  const stats = await News.aggregate([
    {
      $match: {
        length: { $gte: 150 }
      }
    },
    {
      $group: {
        _id: null, // '$type' - to group
        numNews: { $sum: 1 },
        avgLength: { $avg: '$length' },
        // numRatings: { $sum: '$ratingsQuantity' },
        // numRatings: { $sum: '$ratingsQuantity' },
        // avgPrice: { $avg: '$price' },
        minLength: { $min: '$length' },
        maxLength: { $max: '$length' }
      }
    },
    {
      $sort: { minLength: 1 }
    },
    {
      $match: { _id: { $ne: 'funny' } }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await News.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numNewsStarts: { $sum: 1 },
        news: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: {
        numNewsStarts: -1
      }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

exports.getMyNews = catchAsync(async (req, res, next) => {
  // 1) Find all News
  const news = await News.find({ autor: req.user.id });
  // 2) Find all nes with returned IDs
  // const newsIds = news.map(el => el._id);
  // const newsResults = await newsIds.find({
  //   _id: { $in: newsIds }
  // });

  res.status(200).json({
    status: 'success',
    data: {
      data: news
    }
  });
});
