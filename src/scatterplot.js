import * as d3 from "d3";
import { legendSize } from "d3-svg-legend";

class Scatterplot {
  constructor() {
    this.svg = d3.select("#scatterplot");
    this.margin = 40;
    this.legend = this.svg
      .append("g")
      .attr("transform", `translate(${this.margin / 4}, ${this.margin / 2})`);
    this.height = this.svg.node().getBoundingClientRect().height - 1.5 * this.margin;
    this.width = this.svg.node().getBoundingClientRect().width - 6 * this.margin;
    this.chart = this.svg.append("g").attr("transform", `translate(${this.margin * 6}, 0)`);
  }

  initialize(data) {
    // Generate the data for the chart
    const chartData = this.generateChartData(data);
    const { rDomain } = this.getDomains(chartData);

    this.allLanguages = _.map(chartData, d => d.key);
    // Create scales
    this.xScale = d3.scaleLinear().range([0, this.width]);
    this.yScale = d3.scaleLinear().range([this.height, 0]);
    this.rScale = d3
      .scaleLinear()
      .range([5, 15])
      .domain(rDomain);

    // Create chart elements
    this.createCircles(chartData);
    this.createAxes();
    this.render(data, 0);
    this.createLegend();
    this.createLabels();
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
        medianCompensation: d3.median(groupedData[d], e => +e["ConvertedComp"]),
        avgYearsCodePro: d3.mean(groupedData[d], e => +e["YearsCodePro"]),
      }))
      .entries(d3.keys(groupedData));
  }
  createCircles(chartData) {
    const { chart, xScale, yScale, rScale, height } = this;
    chartData = chartData.sort((a, b) => d3.ascending(a.key, b.key));
    chart
      .selectAll("circle")
      .data(chartData)
      .enter()
      .append("circle")
      .on("mouseenter", function(language) {
        if (_.get(language, "hide", false)) {
          return;
        }
        d3.select(this)
          .transition()
          .ease(d3.easeCubic)
          .duration(300)
          .attr("opacity", 1)
          .attr("x", item => xScale(item.key) - 5)
          .attr("r", d => rScale(d.value.respondants) * 1.25);

        // Create a line for reference
        const y = yScale(language.value.medianCompensation);
        const x = xScale(language.value.avgYearsCodePro);
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
      .on("mouseleave", function(language) {
        if (_.get(language, "hide", false)) {
          return;
        }
        d3.select(this)
          .transition()
          .ease(d3.easeCubic)
          .duration(300)
          .attr("opacity", 0.8)
          .attr("x", item => xScale(item.key) - 5)
          .attr("r", d => rScale(d.value.respondants));
        chart.selectAll(".limit").remove();
      });
    chart
      .selectAll("text.annotation")
      .data(chartData)
      .enter()
      .append("text")
      .attr("class", "annotation")
      .text(d => d.key);
  }
  updateCircles(chartData, hideData) {
    const { chart, xScale, yScale, rScale } = this;
    const allData = _.concat(chartData, hideData).sort((a, b) => d3.ascending(a.key, b.key));
    chart
      .selectAll("circle")
      .data(allData)
      .transition()
      .ease(d3.easeCubic)
      .duration(1000)
      .attr("opacity", d => (_.get(d, "hide") ? 0 : 0.8))
      .attr("cx", function(d) {
        return _.get(d, "hide") ? this.getAttribute("cx") : xScale(d.value.avgYearsCodePro);
      })
      .attr("cy", function(d) {
        return _.get(d, "hide") ? this.getAttribute("cy") : yScale(d.value.medianCompensation);
      })
      .attr("r", function(d) {
        return _.get(d, "hide") ? this.getAttribute("r") : rScale(d.value.respondants);
      });
    chart
      .selectAll("text.annotation")
      .data(allData)
      .transition()
      .ease(d3.easeCubic)
      .duration(1000)
      .attr("opacity", d => (_.get(d, "hide") ? 0 : 1))
      .attr("x", function(d) {
        return _.get(d, "hide")
          ? this.getAttribute("x")
          : xScale(d.value.avgYearsCodePro) + rScale(d.value.respondants) + 2;
      })
      .attr("y", function(d) {
        return _.get(d, "hide")
          ? this.getAttribute("y")
          : yScale(d.value.medianCompensation) + rScale(d.value.respondants) / 2;
      });
  }

  createLegend() {
    this.legend.call(
      legendSize()
        .scale(this.rScale)
        .cells([5000, 10000, 15000, 20000, 25000, 30000])
        .shape("circle")
        .shapePadding(15)
        .title("Responses by Language:")
        .labelOffset(20)
        .labelFormat(d3.format(",.0f"))
        .orient("vertical")
    );
  }

  createLabels() {
    const { svg, height, width, margin } = this;
    // Label for Y Axis
    svg
      .append("text")
      .attr("class", "label")
      .attr("x", -(height / 2))
      .attr("y", margin * 4)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("Median Compensation ($)");

    // Label for X Axis
    svg
      .append("text")
      .attr("class", "label")
      .attr("x", width / 2 + margin * 6)
      .attr("y", height + margin)
      .attr("text-anchor", "middle")
      .text("Average Years of Professional Coding");
  }

  filterByMinimum(chartData, minimum) {
    const result = _.reduce(
      chartData,
      (result, d) => {
        if (d.value.respondants < minimum) {
          result.hideData.push({ key: d.key, hide: true });
        } else {
          result.chartData.push(_.assign(d, { hide: false }));
        }
        return result;
      },
      {
        chartData: [],
        hideData: [],
      }
    );
    result.hideData = _.concat(
      result.hideData,
      _.map(_.difference(this.allLanguages, _.map(result.chartData, d => d.key)), k => ({
        key: k,
        hide: true,
      }))
    );
    return result;
  }

  render(data, minimum) {
    const { xScale, yScale } = this;

    // Update chart data and domains according to new data
    const { chartData, hideData } = this.filterByMinimum(this.generateChartData(data), minimum);
    const { xDomain, yDomain } = this.getDomains(chartData);

    // Scale the domain according to the new data
    xScale.domain(xDomain);
    yScale.domain(yDomain);

    // Update chart content
    this.updateCircles(chartData, hideData);
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
      _.min(_.map(chartData, c => c.value.avgYearsCodePro)) * 0.95,
      _.max(_.map(chartData, c => c.value.avgYearsCodePro)) * 1.05,
    ];
    const yDomain = [
      _.min(_.map(chartData, c => c.value.medianCompensation)) * 0.95,
      _.max(_.map(chartData, c => c.value.medianCompensation)) * 1.05,
    ];
    const rDomain = [
      _.min(_.map(chartData, c => c.value.respondants)),
      _.max(_.map(chartData, c => c.value.respondants)),
    ];
    return { xDomain, yDomain, rDomain };
  }
}

export default Scatterplot;
