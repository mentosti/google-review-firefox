const puppeteer = require("puppeteer");
var fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: "reviews.csv",
  header: [
    { id: "id", title: "ID" },
    { id: "location", title: "Location" },
    { id: "name", title: "Name" },
    { id: "type", title: "Type" },
    { id: "totalReviews", title: "Total Reviews" },
    { id: "star", title: "Star" },
    { id: "time", title: "Time" },
    { id: "content", title: "Content" },
    { id: "lang", title: "Language" },
    { id: "like", title: "Like" },
  ],
});
(async () => {
  const urls = [
    // "https://www.google.com/maps/place/Starbucks+Hikari/@11.0584236,106.6845205,15z/data=!4m8!3m7!1s0x3174cf71e4b1010f:0xaf208edc09b5b83a!8m2!3d11.0584236!4d106.6845205!9m1!1b1!16s%2Fg%2F11tbtx3jsk?entry=ttu",
    // "https://www.google.com/maps/place/Eastern+International+University/@11.0509071,106.5352822,12z/data=!4m22!1m13!4m12!1m4!2m2!1d106.570193!2d11.0691667!4e1!1m6!1m2!1s0x3174d1d7df763eaf:0xf4323e44f2867057!2seiu+mien+dong+map!2m2!1d106.6661689!2d11.0530121!3m7!1s0x3174d1d7df763eaf:0xf4323e44f2867057!8m2!3d11.0530121!4d106.6661689!9m1!1b1!16s%2Fg%2F1yw9kvsdy?entry=ttu",
    // "https://www.google.com/maps/place/Eastern+International+University/@11.0530174,106.663594,17z/data=!4m8!3m7!1s0x3174d1d7df763eaf:0xf4323e44f2867057!8m2!3d11.0530121!4d106.6661689!9m1!1b1!16s%2Fg%2F1yw9kvsdy?entry=ttu",
    "https://www.google.com/maps/place/War+Remnants+Museum/@10.7794997,106.6096897,12z/data=!4m21!1m12!4m11!1m3!2m2!1d106.6920937!2d10.785054!1m6!1m2!1s0x31752f30a23708cf:0x7cd94adf2b1474aa!2sPh%C6%B0%E1%BB%9Dng+6,+District+3,+Ho+Chi+Minh+City+700000!2m2!1d106.6920916!2d10.7795106!3m7!1s0x31752f30a23708cf:0x7cd94adf2b1474aa!8m2!3d10.7795106!4d106.6920916!9m1!1b1!16s%2Fm%2F02pt71k?entry=ttu",
  ];
  let data = [];
  const browser = await puppeteer.launch({
    headless: true,
    product: "firefox",
  });
  let idx = 1;
  for (var i = 0; i < urls.length; i++) {
    console.log("Crawling page: " + i);
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36"
    );
    await page.goto(urls[i]);
    await page.setViewport({
      width: 1200,
      height: 800,
    });

    await page.waitForSelector(".m6QErb.DxyBCb.kA9KIf.dS8AEf");

    const totalReviews = await page.evaluate(() => {
      return parseInt(
        document
          .querySelector(".jANrlb > .fontBodySmall")
          .textContent.split("reviews")[0]
          .replace(",", "")
          .trim()
      );
    });
    let currentNumReviews = 0;
    const location = await page.evaluate(() => {
      return document.querySelector("#searchboxinput").value;
    });
    while (currentNumReviews < totalReviews) {
      await page.evaluate(
        async (totalReviews, currentNumReviews) => {
          await new Promise((resolve) => {
            var timer = setInterval(() => {
              const scrollable = document.querySelector(
                ".m6QErb.DxyBCb.kA9KIf.dS8AEf"
              );
              scrollable.scrollTop += 20000;

              const reviews = document.querySelectorAll(
                ".jftiEf.fontBodyMedium"
              );

              if (
                reviews.length > 100 ||
                currentNumReviews + reviews.length === totalReviews
              ) {
                clearInterval(timer);
                resolve();
              }
            }, 500);
          });
        },
        totalReviews,
        currentNumReviews
      );

      currentNumReviews += 100;
      console.log(currentNumReviews);
      await page.evaluate(() => {
        const moreButtons = document.querySelectorAll(".w8nwRe.kyuRq");
        moreButtons.forEach((moreButton) => {
          moreButton.click();
        });
      });

      await page.waitForTimeout(500);

      const result = await page.evaluate(
        (idx, location) => {
          const getDataFromElement = (element, attribute = "textContent") => {
            return element ? element[attribute].trim() : "";
          };
          const result = [];
          const reviews = document.querySelectorAll(".jftiEf.fontBodyMedium");

          reviews.forEach((review, i) => {
            if (i >= 100) {
              return;
            }
            const reviewerName = getDataFromElement(
              review.querySelector(".d4r55")
            );

            const reviewerTypeReviews = getDataFromElement(
              review.querySelector(".RfnDt")
            ).split(" · ");
            let reviewerType = "";
            let reviewerReviews = "";
            if (reviewerTypeReviews.length == 1) {
              if (reviewerTypeReviews[0].includes("review")) {
                reviewerReviews = reviewerTypeReviews[0]
                  .split("reviews")[0]
                  .split("review")[0]
                  .trim();
              } else {
                reviewerType = reviewerTypeReviews[0].trim();
              }
            } else {
              reviewerType = reviewerTypeReviews[0].trim();
              reviewerReviews = reviewerTypeReviews[1]
                .split("reviews")[0]
                .split("review")[0]
                .trim();
            }

            const reviewerStar = getDataFromElement(
              review.querySelector(".kvMYJc"),
              "ariaLabel"
            )
              .split("stars")[0]
              .split("star")[0]
              .trim();
            const reviewerTime = getDataFromElement(
              review.querySelector(".rsqaWe")
            );

            const reviewerContent = getDataFromElement(
              review.querySelector(".wiI7pd")
            );
            const reviewerLang = getDataFromElement(
              review.querySelector(".MyEned"),
              "lang"
            );
            const reviewerLike = getDataFromElement(
              review.querySelector(".pkWtMe")
            );

            result.push({
              id: idx++,
              location,
              name: reviewerName,
              type: reviewerType,
              totalReviews: reviewerReviews,
              star: reviewerStar,
              time: reviewerTime,
              content: reviewerContent,
              lang: reviewerLang,
              like: reviewerLike,
            });

            review.innerHTML = "";
            review.remove();
            review = null;
          });
          return result;
        },
        idx,
        location
      );

      idx += result.length;
      console.log("Currently crawling: " + idx + " reviews");
      csvWriter
        .writeRecords(result)
        .then(() => console.log("The CSV file was written successfully"));
    }
    // data = data.concat(result);
    await page.close();
  }
  await browser.close();
})();
