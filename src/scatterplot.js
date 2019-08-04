import * as d3 from "d3";

class Scatterplot {
  constructor() {
    this.svg = d3.select("#scatterplot");
    this.margin = 80;
    this.height =
      this.svg.node().getBoundingClientRect().height - 2 * this.margin;
    this.width = this.svg.node().getBoundingClientRect().width - this.margin;
    this.chart = this.svg
      .append("g")
      .attr("transform", `translate(${this.margin}, ${this.margin})`);
  }

  initialize(data) {
    // Create scales
    this.xScale = d3.scaleLinear().range([0, this.width]);
    this.yScale = d3.scaleLinear().range([this.height, 0]);
    this.rScale = d3.scaleLog().range([0, (this.height + this.width) / 128]);

    // Generate the data for the chart
    const chartData = this.generateChartData(data);

    // Create chart elements
    this.createCircles(chartData);
    this.createAxes();
    this.render(data);
  }

  generateChartData(data) {
    const groupedData = data.reduce((result, item) => {
      for (let language of item.LanguageWorkedWith) {
        const languageKey = (result[language] = result[language] || []);
        languageKey.push(item);
      }
      return result;
    }, {});

    return d3
      .nest()
      .key(d => d)
      .rollup(d => ({
        respondants: groupedData[d].length,
        medianCompensation: d3.median(groupedData[d], e =>
          e["ConvertedComp"] != "NA" ? +e["ConvertedComp"] : null
        ),
        avgYearsCodePro: d3.mean(groupedData[d], e =>
          e["YearsCodePro"] != "NA" ? +e["YearsCodePro"] : null
        )
      }))
      .entries(d3.keys(groupedData));
  }
  createCircles(chartData) {
    const { svg, chart, xScale, yScale, rScale, height, margin } = this;
    svg
      .selectAll("circle")
      .data(chartData)
      .enter()
      .append("circle")
      .on("mouseenter", function(language) {
        d3.select(this)
          .transition()
          .ease(d3.easeCubic)
          .duration(300)
          .attr("opacity", 1)
          .attr("x", item => xScale(item.key) - 5)
          .attr("r", d => rScale(d.value.respondants) * 1.2);

        // Create a line for reference
        const y = yScale(language.value.medianCompensation) - margin;
        const x = xScale(language.value.avgYearsCodePro) - margin;
        chart
          .append("line")
          .attr("class", "limit")
          .attr("x1", 0)
          .attr("y1", y)
          .attr("x2", x)
          .attr("y2", y);
        chart
          .append("line")
          .attr("class", "limit")
          .attr("x1", x)
          .attr("y1", y)
          .attr("x2", x)
          .attr("y2", height);
      })
      .on("mouseleave", function() {
        d3.select(this)
          .transition()
          .ease(d3.easeCubic)
          .duration(300)
          .attr("opacity", 0.8)
          .attr("x", item => xScale(item.key) - 5)
          .attr("r", d => rScale(d.value.respondants));
        chart.selectAll(".limit").remove();
      });
    svg
      .selectAll("text.annotation")
      .data(chartData)
      .enter()
      .append("text")
      .attr("class", "annotation")
      .text(d => d.key);
  }
  updateCircles(chartData) {
    const { svg, xScale, yScale, rScale } = this;
    svg
      .selectAll("circle")
      .data(chartData)
      .transition()
      .ease(d3.easeCubic)
      .duration(1000)
      .attr("cx", d => xScale(d.value.avgYearsCodePro))
      .attr("cy", d => yScale(d.value.medianCompensation))
      .attr("r", d => rScale(d.value.respondants));
    svg
      .selectAll("text.annotation")
      .data(chartData)
      .transition()
      .ease(d3.easeCubic)
      .duration(1000)
      .attr(
        "x",
        d =>
          xScale(d.value.avgYearsCodePro) + rScale(d.value.respondants) + 2
      )
      .attr(
        "y",
        d =>
          yScale(d.value.medianCompensation) +
          rScale(d.value.respondants) / 2
      );
  }

  render(data) {
    const { xScale, yScale, rScale } = this;

    // Update chart data and domains according to new data
    const chartData = this.generateChartData(data);
    const { xDomain, yDomain, rDomain } = this.getDomains(chartData);

    // Scale the domain according to the new data
    xScale.domain(xDomain);
    yScale.domain(yDomain);
    rScale.domain(rDomain);

    // Update chart content
    this.updateCircles(chartData);
    this.updateAxes();
  }
  createAxes() {
    // X Axis
    this.chart
      .append("g")
      .attr("class", "xAxis")
      .attr("transform", `translate(0, ${this.height})`);

    // Y Axis
    this.chart.append("g").attr("class", "yAxis");

    // Grid lines Y Axis
    this.chart.append("g").attr("class", "grid yGridLines");

    // Grid lines X Axis
    this.chart.append("g").attr("class", "grid xGridLines");
  }

  updateAxes() {
    const { chart, xScale, yScale, width, height } = this;
    // X Axis
    chart
      .select(".xAxis")
      .transition()
      .ease(d3.easeCubic)
      .duration(1000)
      .call(d3.axisBottom(xScale));

    // Y Axis
    chart
      .select(".yAxis")
      .transition()
      .ease(d3.easeCubic)
      .duration(1000)
      .call(d3.axisLeft(yScale));

    // Grid lines Y Axis
    chart
      .select(".yGridLines")
      .transition()
      .ease(d3.easeCubic)
      .duration(1000)
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-width)
          .tickFormat("")
      );

    // Grid lines X Axis
    chart
      .select(".xGridLines")
      .transition()
      .ease(d3.easeCubic)
      .duration(1000)
      .call(
        d3
          .axisTop(xScale)
          .tickSize(-height)
          .tickFormat("")
      );
  }
  getDomains(chartData) {
    const xDomain = [
      _.min(_.map(chartData, c => c.value.avgYearsCodePro)) * 0.9,
      _.max(_.map(chartData, c => c.value.avgYearsCodePro))
    ];
    const yDomain = [
      _.min(_.map(chartData, c => c.value.medianCompensation)),
      _.max(_.map(chartData, c => c.value.medianCompensation)) * 1.2
    ];
    const rDomain = [
      _.min(_.map(chartData, c => c.value.respondants)),
      _.max(_.map(chartData, c => c.value.respondants))
    ];
    return { xDomain, yDomain, rDomain };
  }
}

export default Scatterplot;
