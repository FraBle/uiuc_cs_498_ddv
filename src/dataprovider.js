class DataProvider {
  constructor(data) {
    this._data = data;
    this._filter = {
      age: {
        min: +d3.min(data, d => d["Age"]),
        max: +d3.max(data, d => d["Age"]),
      },
      compensation: {
        min: +d3.min(data, d => d["ConvertedComp"]),
        max: +d3.max(data, d => d["ConvertedComp"]),
      },
      gender: _.transform(
        _(data)
          .flatMap(d => d["Gender"])
          .uniq()
          .value(),
        (obj, gender) => (obj[gender] = true),
        {}
      ),
      minResponses: 0,
    };
  }

  getData() {
    return this._data.filter(
      d =>
        +d["Age"] >= this._filter.age.min &&
        +d["Age"] <= this._filter.age.max &&
        +d["ConvertedComp"] >= this._filter.compensation.min &&
        +d["ConvertedComp"] <= this._filter.compensation.max &&
        _.difference(
          d["Gender"],
          _(this._filter.gender)
            .pickBy(v => !v)
            .keys()
            .value()
        ).length !== 0
    );
  }

  getMinResponsesFilter() {
    return this._filter.minResponses;
  }

  setMinResponsesFilter(value) {
    this._filter.minResponses = +value;
  }

  getAgeFilter() {
    return this._filter.age;
  }

  getCompensationFilter() {
    return this._filter.compensation;
  }

  getGenderFilter() {
    return this._filter.gender;
  }
}

export default DataProvider;
