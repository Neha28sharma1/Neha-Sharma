// Select the mainHeading element
// const mainHeading = document.getElementById("mainHeading");
const mainImage = document.getElementById("mainImage");
const newImage = document.createElement("img");
//Images copied from shutterstock
const headingphotos = ["pics/3.png", "pics/1.png", "pics/2.png"];

let index = 0;

function update() {
  const headingphoto = headingphotos[index];
  const delay = 1000; // 2 seconds

  const myPromise = new Promise((resolve) => {
    setTimeout(() => {
      resolve(headingphoto);
    }, delay);
  });

  // Handle the resolved promise
  myPromise.then((photo) => {
    newImage.src = `${photo}`;
    newImage.classList.add("main_image");
    mainImage.appendChild(newImage);

    // Move to the next heading text
    index = (index + 1) % headingphotos.length;

    setTimeout(update, delay);
  });
}

const hamBurgerMenu = document.querySelector(".hamburger-menu");
const hiddenMenu = document.querySelector(".nav-container_hidden");

hamBurgerMenu.addEventListener("click", function (event) {
  hamBurgerMenu.classList.toggle("active");
  hiddenMenu.classList.toggle("active");
});

window.addEventListener("load", update);
