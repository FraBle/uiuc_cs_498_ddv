import DataProvider from "./dataprovider"
import BarChart from "./barChart"
import Scatterplot from "./scatterplot"
import WorldMap from "./worldMap"
import Filters from "./filters"

class Slideshow {
  async initialize() {
    this.element = document.querySelector(".carousel");
    this.instance = M.Carousel.init(this.element, {
      fullWidth: true,
      indicators: true,
      noWrap: true
    })
    M.Tabs.init(document.querySelector(".tabs"))

    const data = await d3.json("data/chart.json")
    const dataProvider = new DataProvider(data)

    // Create the charts and initialize them
    const barChart = new BarChart()
    barChart.initialize(data)
    const scatterplot = new Scatterplot()
    scatterplot.initialize(data)
    const worldMap = new WorldMap();
    await worldMap.initialize(data);

    // Initialize Filters
    this.filters = new Filters(dataProvider, [
      barChart,
      scatterplot,
      worldMap
    ]);
    this.filters.initialize();
  }

  async enable() {
    // const carouselElement = document.querySelector(".carousel");
    // var instance = M.Carousel.getInstance(carouselElement);
    const {instance, filters } = this;
    document.addEventListener("keydown", event => {
      switch (event.key) {
        case "ArrowLeft":
          instance.prev();
          break;
        case "ArrowRight":
          instance.next();
          break;
      }
    });
    const buttonLeft = document.querySelector("#button-left");
    buttonLeft.classList.remove("disabled");
    buttonLeft.addEventListener("click", e => instance.prev());

    const buttonRight = document.querySelector("#button-right");
    buttonRight.classList.remove("disabled");
    buttonRight.addEventListener("click", e => instance.next());

    const resetButton = document.querySelector("#reset-button");
    resetButton.classList.remove("disabled");
    resetButton.addEventListener("click", e => filters.reset());

    const progressBar = document.querySelector(".progress div");
    progressBar.className = "determinate";
    progressBar.setAttribute("style", "width:100%;");

    document.querySelector("#progress-title").innerHTML =
      "Loading the data... finished :)";
  }
}

export default Slideshow;
