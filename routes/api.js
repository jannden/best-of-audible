"use strict";

const rp = require("request-promise");
const $ = require("cheerio");

const parsePage = (html) => {
  // Log out at which stage in the pagination we are
  console.log("new page", $(".resultsSummarySubheading", html).text());

  // Prepare empty array for all books, which will be filled with an object for each found book
  let library = [];

  // Prepare empty arrays which we will use to fill out the individual book objects
  let title = [];
  let subtitle = [];
  let cover = [];
  let author = [];
  let ratingCount = [];
  let ratingScore = [];
  let url = [];

  // We will loop over each book found on the page and start filling out our helper arrays
  $(".adbl-impression-container > li", html).each(function () {
    // Prepare the content of the book
    const content = $(this).html();

    // Parse the HTML elements to find specific pieces of the content
    // Title
    title.push($("h3 a", content).text());
    // Subtitle
    subtitle.push($(".subtitle > span", content).text());
    // Cover
    cover.push(
      $(".bc-pub-block img", content)[0].attribs.src.replace("SL5_", "SL100_")
    );
    // Author
    author.push($(".authorLabel a", content).text());
    // Rating Score
    ratingScore.push(
      $(".ratingsLabel .bc-pub-offscreen", content)
        .text()
        .replace(" out of 5 stars", "")
    );
    // Rating Count
    ratingCount.push(
      $(".ratingsLabel .bc-color-secondary", content)
        .text()
        .replace(",", "")
        .replace(" ratings", "")
    );
    // URL
    url.push(
      "https://www.audible.com" +
        $("h3 a", content)[0].attribs.href.split("?")[0]
    );
  });

  // Now let's create a book object for each found book (each helper array index)
  for (let i = 0; i < title.length; i++) {
    let bookObject = {
      title: title[i],
      subtitle: subtitle[i],
      cover: cover[i],
      author: author[i],
      ratingCount: ratingCount[i],
      ratingScore: ratingScore[i],
      url: url[i],
    };

    // And add the book object to the final list of all books
    library.push(bookObject);
  }

  return library;
};

module.exports = function (app) {
  app.route("/api/run").post((req, res) => {
    const { categoryUrl, minRatingScore, minRatingCount, maxPages } = req.body;

    // Due to pagination, we expect to scrape several page
    // For this, we create an array of requests
    let requests = [];
    const urlConnector = /[?]/.test(categoryUrl) ? "&" : "?";
    for (let page = 1; page <= Number(maxPages); page++) {
      requests.push(rp(categoryUrl + urlConnector + "page=" + page));
    }
    Promise.all(requests)
      .then(function (results) {
        const originalLibrary = results.map(parsePage).flat();
        const filteredLibrary = originalLibrary
          .filter(
            (book) =>
              Number(book.ratingScore) >= Number(minRatingScore) &&
              Number(book.ratingCount) >= Number(minRatingCount)
          )
          .sort((a, b) => {
            // Sorting by reviewScore descending and then ratingCount descending
            if (a.ratingScore === b.ratingScore) {
              // ratingCount is only important when ratingScore is the same
              return b.ratingCount - a.ratingCount;
            }
            return a.ratingScore > b.ratingScore;
          });
        return res.json({
          filteredLibrary,
          skipped: originalLibrary.length - filteredLibrary.length,
          log: originalLibrary,
        });
      })
      .catch(function (error) {
        return res.json({ error });
      });
  });
};
