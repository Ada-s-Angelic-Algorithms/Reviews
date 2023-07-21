require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PWD}@${process.env.DATABASE_URL}?directConnection=true`;
const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});
client.connect();

const reviews = client.db('Atelier-SDC').collection('Reviews');
const meta = client.db('Atelier-SDC').collection('MetaData');

function getReviews(reviewID, sortParam) {
  reviewID = Number(reviewID);
  let sort;
  if (sortParam === 'newest') {
    sort = {date: -1};
  } else if (sortParam === 'helpful') {
    sort = {helpfulness: -1};
  } else {
    sort = {date: -1, helpfulness: -1}
  }
  return reviews.find({product_id: reviewID}, {sort: sort}, {id: 'review_id'});

}

function getMeta(reviewID) {
  reviewID = Number(reviewID);
  return meta.findOne({product_id: reviewID});
}

function addReview(review) {
  let newID;
  let photoID;

  reviews.findOne({}, {sort: {'id': -1}}).then((last) => {
    newID = last.id + 1;
    if (review.photos && review.photos.length > 0) {
      reviews.findOne({photos: {$exists: true, $ne: []}}, {sort: {'id': -1}}).then((last) => {
        photoID = last.photos[last.photos.length - 1].id + 1;
        for (let photo of review.photos) {
          photo = {id: photoID, url: photo}
          photoID++
        }
      })
    }
    reviews.insertOne(
      {
        id: newID,
        product_id: review.product_id,
        rating: review.rating,
        date: new Date(),
        summary: review.summary,
        body: review.body,
        recommend: review.recommend,
        reviewer_name: review.name,
        reviewer_email: review.email,
        response: null,
        helpfulness: 0,
        photos: review.photos
      }
      )
    })
    meta.findOne({product_id: review.product_id}).then((data) => {
      for (let key in review.characteristics) {
        for (let name in data.characteristics) {
          let char = data.characteristics[name]
          if (char.id.toString() === key) {
            let totalVal = char.value * char.total;
            totalVal += review.characteristics[key]
            let newTotal = char.total + 1;
            let newVal = totalVal/newTotal;
            meta.updateOne(
              {product_id: review.product_id},
              {
                $set: {
                  ['characteristics.'+name+'.value']: newVal,
                  ['characteristics.'+name+'.total']: newTotal
                }
            }
            )
          }
        }
      }
      console.log(review.recommend)
      let rec;
      if (review.recommend) {
        console.log('rec is true i run')
        rec = '1';
      } else {
        rec = '0';
      }
      console.log(rec)
      meta.updateOne(
        {product_id: review.product_id},
        {
          $inc: {['recommend.'+rec]: 1, ['ratings.'+review.rating]: 1},
        }
      )
    })
}

function updateHelpful(reviewID) {
  reviewID = Number(reviewID);
  reviews.updateOne(
    {id: reviewID},
    {$inc: {helpfulness: 1}}
  )
}

function report(reviewID) {
  reviewID = Number(reviewID);
  reviews.updateOne(
    {id: reviewID},
    {$set: {reported: true}}
    )
}

module.exports.getReviews = getReviews;
module.exports.updateHelpful = updateHelpful;
module.exports.report = report;
module.exports.addReview = addReview;
module.exports.getMeta = getMeta;





