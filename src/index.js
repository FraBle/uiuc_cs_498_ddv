import "core-js/stable";
import "regenerator-runtime/runtime";

import Slideshow from "./slideshow";
import "./nouislider";
import "./styles/app.css";

document.addEventListener("DOMContentLoaded", async () => {
  const slideshow = new Slideshow();
  await slideshow.initialize();
  await slideshow.enable();
});
