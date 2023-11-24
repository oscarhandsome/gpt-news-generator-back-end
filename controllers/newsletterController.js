const Newsletter = require('./../models/newsletterModel');
const factory = require('./handlerFactory');

exports.getAllNewsletters = factory.getAll(Newsletter);
exports.getNewsletter = factory.getOne(Newsletter);
exports.createNewsletter = factory.createOne(Newsletter);
exports.updateNewsletter = factory.updateOne(Newsletter);
exports.deleteNewsletter = factory.deleteOne(Newsletter);
