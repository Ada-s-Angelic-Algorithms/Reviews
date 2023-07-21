require('dotenv').config()
const express = require('express');
const app = express();
const port = process.env.SERVER_PORT;
const cors = require('cors');
const getReviews = require('../database/index.js').getReviews;
const updateHelpful = require('../database/index.js').updateHelpful;
const report = require('../database/index.js').report;
const addReview = require('../database/index.js').addReview;
const getMeta = require('../database/index.js').getMeta;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

//Get all reviews for a product
app.get('/reviews', (req, res) => {
  let reviewsResponse = {};
  if (req.query.page) {
    reviewsResponse.page = req.params.page;
  } else {
    reviewsResponse.page = 1;
  }
  if (req.query.count) {
    reviewsResponse.count = req.params.count;
  } else {
    reviewsResponse.count = 5;
  }
  if (req.query.product_id) {
    reviewsResponse.product = req.query.product_id;
    getReviews(reviewsResponse.product, req.query.sort).toArray().then((reviews) => {
      reviews.forEach((review) => {
        if (!review.photos) {
          review.photos = [];
        }
      })
      reviewsResponse.results = reviews;
      reviewsResponse.results.forEach((review) => {
        review.review_id = review.id;
        delete review.id;
      })
      res.send(reviewsResponse);
    })
  } else {
    res.status(400);
  }
})

//Get metadata about reviews for a product
app.get('/reviews/meta', (req, res) => {
  getMeta(req.query.product_id).then((meta) => {
    res.status(200).send(meta);
  })
})

//Mark a review as helpful
app.put('/reviews/:review_id/helpful', (req, res) => {
  updateHelpful(req.params.review_id);
  res.sendStatus(204);
})


//Report a review
app.put('/reviews/:review_id/report', (req, res) => {
  report(req.params.review_id)
  res.sendStatus(204);
})

//Add a new review
app.post('/reviews', (req, res) => {
  addReview(req.body);
  res.sendStatus(201);
})


app.listen(port, () => {
  console.log(`testing express route /reviews listening on port ${port}`);
})