const formExamples = document.querySelectorAll(".form-text > a");
formExamples.forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    document.getElementById(item.dataset.for).value = item.dataset.example;
  });
});

const audibleScraper = async (event) => {
  event.preventDefault();

  const categoryUrl = document.getElementById("categoryUrl").value;
  const minRatingScore = document.getElementById("minRatingScore").value;
  const minRatingCount = document.getElementById("minRatingCount").value;
  const maxPages = document.getElementById("maxPages").value;
  const outputArea = document.getElementById("output-container");
  outputArea.innerHTML = "";
  const spinner = document.createElement("div");
  spinner.classList.add("spinner-border");
  outputArea.appendChild(spinner);

  const postData = { categoryUrl, minRatingScore, minRatingCount, maxPages };
  const output = await fetch("/api/run", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-type": "application/json",
    },
    body: JSON.stringify(postData),
  });

  const parsed = await output.json();
  console.log(parsed);
  if (parsed.error) {
    const alert = document.createElement("div");
    alert.classList.add("alert");
    alert.classList.add("alert-danger");
    alert.innerText = JSON.stringify(parsed.error.message);
    outputArea.appendChild(alert);
    return;
  }

  result = `<div class='alert alert-success'>There were ${parsed.skipped} books filtered out due to your settings.</div>`;
  result += parsed.filteredLibrary
    .map(
      (book) =>
        `<div class='clearfix mb-3'>
        <img src="${book.cover}" class="img-thumbnail w-25 float-start me-3"></img>
        <h4>${book.title}</h4>
        <div>${book.subtitle}</div>
        <div>${book.author}</div>
        <div>Average rating: ${book.ratingScore}</div>
        <div>Number of reviewers: ${book.ratingCount}</div>
        <div><a href='${book.url}' target='_blank'>Open in Audible</a></div>
      </div>`
    )
    .join("");

  console.log(parsed.log);
  outputArea.innerHTML = result;
  return;
};

document
  .getElementById("sortingForm")
  .addEventListener("submit", audibleScraper);
