const removeDuplicateGigs = (gigs) => {
  const seenIds = new Set();
  const seenTitles = new Set();
  return gigs.filter(gig => {
    // First, check for duplicate IDs (primary key)
    if (seenIds.has(gig._id)) {
      return false;
    } else {
      seenIds.add(gig._id);
    }

    // Then, check for duplicate titles to prevent showing multiple gigs with the same title on the homepage carousel
    if (seenTitles.has(gig.title)) {
      return false;
    } else {
      seenTitles.add(gig.title);
      return true;
    }
  });
};

export default removeDuplicateGigs; 