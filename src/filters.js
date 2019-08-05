class Filters {
  constructor(dataProvider, charts) {
    this.dataProvider = dataProvider;
    this.charts = charts;
    this.responsesFilter = document.querySelector("#responses-filter");
    this.ageFilter = document.querySelector("#age-filter");
    this.compensationFilter = document.querySelector("#compensation-filter");
    this.genderFilter = document.querySelector("#gender-filter");
  }

  initialize() {
    this.initializeResponsesFilter();
    this.initializeAgeFilter();
    this.initializeCompensationFilter();
    this.initializeGenderFilter();
  }

  reset() {
    this.responsesFilter.noUiSlider.reset();
    this.ageFilter.noUiSlider.reset();
    this.compensationFilter.noUiSlider.reset();
    this.genderFilter.querySelectorAll("input").forEach(input => {
      input.checked = true;
      input.dispatchEvent(new Event("change"));
    });
  }

  initializeResponsesFilter() {
    const { dataProvider, charts } = this;
    this.responsesFilter.innerHTML = "";
    noUiSlider.create(this.responsesFilter, {
      start: 0,
      connect: "lower",
      step: 1,
      orientation: "horizontal",
      range: {
        min: 0,
        max: 100
      },
      format: wNumb({
        decimals: 0
      })
    });
    this.responsesFilter.noUiSlider.on("set", function(values) {
      dataProvider.setMinResponsesFilter(values[0]);
      for (let chart of charts) {
        chart.render(
          dataProvider.getData(),
          dataProvider.getMinResponsesFilter()
        );
      }
    });
  }

  initializeAgeFilter() {
    const { dataProvider, charts } = this;
    this.ageFilter.innerHTML = "";
    noUiSlider.create(this.ageFilter, {
      start: [dataProvider.getAgeFilter().min, dataProvider.getAgeFilter().max],
      connect: true,
      step: 1,
      orientation: "horizontal",
      range: {
        min: dataProvider.getAgeFilter().min,
        max: dataProvider.getAgeFilter().max
      },
      format: wNumb({
        decimals: 0
      })
    });
    this.ageFilter.noUiSlider.on("set", function(values) {
      dataProvider.getAgeFilter().min = values[0];
      dataProvider.getAgeFilter().max = values[1];
      for (let chart of charts) {
        chart.render(
          dataProvider.getData(),
          dataProvider.getMinResponsesFilter()
        );
      }
    });
  }
  initializeCompensationFilter() {
    const { dataProvider, charts } = this;
    this.compensationFilter.innerHTML = "";
    noUiSlider.create(this.compensationFilter, {
      start: [
        Math.round(dataProvider.getCompensationFilter().min),
        Math.round(dataProvider.getCompensationFilter().max)
      ],
      connect: true,
      step: 10000,
      tooltips: [
        wNumb({
          decimals: 0,
          encoder: v => v / 1000,
          prefix: "$",
          suffix: "k"
        }),
        wNumb({
          decimals: 0,
          encoder: v => v / 1000,
          prefix: "$",
          suffix: "k"
        })
      ],
      orientation: "horizontal",
      range: {
        min: dataProvider.getCompensationFilter().min,
        max: dataProvider.getCompensationFilter().max
      },
      format: wNumb({
        decimals: 0
      })
    });
    this.compensationFilter.noUiSlider.on("set", function(values) {
      dataProvider.getCompensationFilter().min = values[0];
      dataProvider.getCompensationFilter().max = values[1];
      for (let chart of charts) {
        chart.render(
          dataProvider.getData(),
          dataProvider.getMinResponsesFilter()
        );
      }
    });
  }

  initializeGenderFilter() {
    const { dataProvider, charts } = this;
    this.genderFilter.innerHTML = "<h6>Gender</h6>";
    this.genderFilter.insertAdjacentHTML(
      "beforeend",
      _.join(
        _.map(
          _.keys(dataProvider.getGenderFilter()),
          gender => `
              <p>
                  <label>
                      <input value="${gender}" type="checkbox" checked="checked" />
                      <span>${gender}</span>
                  </label>
              </p>
          `
        ),
        ""
      )
    );

    this.genderFilter.querySelectorAll("input").forEach(link => {
      link.addEventListener("change", function(event) {
        dataProvider.getGenderFilter()[this.value] = this.checked;
        for (let chart of charts) {
          chart.render(
            dataProvider.getData(),
            dataProvider.getMinResponsesFilter()
          );
        }
        event.preventDefault();
      });
    });
  }
}
export default Filters;
