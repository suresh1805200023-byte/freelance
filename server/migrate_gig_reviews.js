const mongoose = require('mongoose');
const { Gig, Review } = require('./src/models');
const db = require('./src/configs/db');
require('dotenv').config();

async function migrateReviews() {
  await db(); // connect to DB

  const gigs = await Gig.find().populate('reviews.userID', 'username email');
  let migrated = 0;

  for (const gig of gigs) {
    if (Array.isArray(gig.reviews)) {
      for (const review of gig.reviews) {
        // Check if this review already exists in Review collection
        const exists = await Review.findOne({
          userID: review.userID,
          gigID: gig._id,
          star: review.star,
          description: review.review
        });
        if (!exists) {
          await Review.create({
            userID: review.userID,
            gigID: gig._id,
            star: review.star,
            description: review.review
          });
          migrated++;
        }
      }
    }
  }

  console.log(`Migration complete. Migrated ${migrated} reviews.`);
  process.exit(0);
}

migrateReviews().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});