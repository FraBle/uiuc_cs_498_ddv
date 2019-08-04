class DataProvider {
  constructor(data) {
    this._type = "DataProvider";
    this._data = data;

    const ageMin = d3.min(data, function(d) {
      return d["Age"] != "NA" ? +d["Age"] : null;
    });
    const ageMax = d3.max(data, function(d) {
      return d["Age"] != "NA" ? +d["Age"] : null;
    });

    const compensationMin = d3.min(data, function(d) {
      return d["ConvertedComp"] != "NA" ? +d["ConvertedComp"] : null;
    });
    const compensationMax = d3.max(data, function(d) {
      return d["ConvertedComp"] != "NA" ? +d["ConvertedComp"] : null;
    });
    const genders = _.transform(
      _(data)
        .flatMap(d => d["Gender"])
        .uniq()
        .value(),
      (obj, gender) => (obj[gender] = true),
      {}
    );

    // Domain values stay the same after initialization
    this._domain = {
      age: {
        min: ageMin,
        max: ageMax
      },
      compensation: {
        min: compensationMin,
        max: compensationMax
      },
      gender: genders,
      programmingLanguage: _(data)
        .flatMap(d => d["LanguageWorkedWith"])
        .uniq()
        .value()
    };

    // Filter values change by user selection
    this._filter = {
      age: {
        min: ageMin,
        max: ageMax
      },
      compensation: {
        min: compensationMin,
        max: compensationMax
      },
      gender: genders
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

  getAgeFilter() {
    return this._filter.age;
  }

  getCompensationFilter() {
    return this._filter.compensation;
  }

  getGenderFilter() {
    return this._filter.gender;
  }

  getAgeDomain() {
    return this._domain.age;
  }

  getCompensationDomain() {
    return this._domain.compensation;
  }

  getProgrammingLanguageDomain() {
    return this._domain.programmingLanguage;
  }

  getAvgYearsCodeProDomain() {
    return this._domain.avgYearsCodePro;
  }

  getMedianCompensationDomain() {
    return this._domain.medianCompensation;
  }

  getResponsesDomain() {
    return this._domain.responses;
  }
}

export default DataProvider;
