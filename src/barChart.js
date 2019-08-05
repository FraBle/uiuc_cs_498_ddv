import * as d3 from "d3";

class BarChart {
  constructor() {
    this.svg = d3.select("#barChart");
    this.margin = 80;
    this.height =
      this.svg.node().getBoundingClientRect().height - 2 * this.margin;
    this.width = this.svg.node().getBoundingClientRect().width - this.margin;
    this.chart = this.svg
      .append("g")
      .attr("transform", `translate(${this.margin}, ${this.margin})`);
  }

  initialize(data) {
    const total = data.length;

    // Create x scale
    this.xScale = d3
      .scaleBand()
      .range([0, this.width])
      .padding(0.3)
      .domain(
        _(data)
          .flatMap(d => d["LanguageWorkedWith"])
          .uniq()
          .value()
          .sort((a, b) => d3.ascending(a, b))
      );

    // Create y scale
    this.yScale = d3
      .scaleLinear()
      .range([this.height, 0])
      .domain([0, 100]);

    // Generate the data for the the initial draw
    const chartData = this.generateChartData(data);
    this.languages = _.map(chartData, d => d.key);

    // Create chart elements
    this.createBars(chartData, total);
    this.createAxes();
    this.render(data);
  }

  generateChartData(data) {
    const groupedData = data.reduce((result, item) => {
      for (let value of item.LanguageWorkedWith) {
        const language = (result[value] = result[value] || []);
        language.push(item);
      }
      return result;
    }, {});

    return d3
      .nest()
      .key(function(d) {
        return d;
      })
      .rollup(function(d) {
        return groupedData[d].length;
      })
      .entries(d3.keys(groupedData));
  }

  updateBars(chartData, total) {
    chartData = _.map(this.languages, language => ({
      key: language,
      value: _.get(_.find(chartData, d => d.key === language), "value", 0)
    }));
    const { svg, chart, xScale, yScale, height, width } = this;
    chartData = chartData.sort((a, b) => d3.ascending(a.key, b.key));
    chart
      .selectAll(".bar")
      .data(chartData)
      .transition()
      .ease(d3.easeCubic)
      .duration(1000)
      .attr("x", item => xScale(item.key))
      .attr("y", item => yScale((item.value / total) * 100))
      .attr("height", item => height - yScale((item.value / total) * 100))
      .attr("width", xScale.bandwidth());

    chart
      .selectAll("text")
      .data(chartData)
      .transition()
      .ease(d3.easeCubic)
      .duration(1000)
      .attr("x", item => xScale(item.key) + xScale.bandwidth() / 2)
      .attr("y", item => yScale((item.value / total) * 100) + 11)
      .text(
        item =>
          `${wNumb({
            suffix: "%",
            decimals: 0
          }).to((item.value / total) * 100)}`
      );

    const barGroups = chart.selectAll("g").data(chartData);

    barGroups
      .on("mouseenter", function(actual, i) {
        // Hide the value of the current bar
        svg.selectAll(".value").attr("opacity", 0);
        // Make the bar slightly bigger
        d3.select(this)
          .transition()
          .duration(300)
          .attr("opacity", 0.6)
          .attr("x", item => xScale(item.key) - 5)
          .attr("width", xScale.bandwidth() + 10);

        // Create a line for reference
        const y = yScale((actual.value / total) * 100);
        chart
          .append("line")
          .attr("class", "limit")
          .attr("x1", 0)
          .attr("y1", y)
          .attr("x2", width)
          .attr("y2", y);

        // Show diff between current bar and others
        barGroups
          .append("text")
          .attr("class", "divergence")
          .attr("x", item => xScale(item.key) + xScale.bandwidth() / 2)
          .attr("y", item => yScale((item.value / total) * 100) + 12)
          .attr("fill", "white")
          .attr("text-anchor", "middle")
          .text((a, idx) => {
            const itemValue = (a.value / total) * 100;
            const actualValue = (actual.value / total) * 100;
            const divergence = itemValue - actualValue;
            return idx !== i
              ? wNumb({
                  prefix: divergence > 0 ? "+" : "",
                  suffix: "%",
                  decimals: 0
                }).to(divergence)
              : "";
          });
      })
      .on("mouseleave", function() {
        svg.selectAll(".value").attr("opacity", 1);
        d3.select(this)
          .transition()
          .duration(300)
          .attr("opacity", 1)
          .attr("x", item => xScale(item.key))
          .attr("width", xScale.bandwidth());

        chart.selectAll(".limit").remove();
        chart.selectAll(".divergence").remove();
      });
  }
  render(data) {
    const chartData = this.generateChartData(data);
    this.updateBars(chartData, data.length);
  }
  createBars(chartData, total) {
    const { svg, chart, xScale, yScale, height, width } = this;

    // Sort the chart data alphabetically
    chartData = chartData.sort((a, b) => d3.ascending(a.key, b.key));

    // Create the SVG groups for the bars
    const barGroups = chart
      .selectAll()
      .data(chartData)
      .enter()
      .append("g");

    // Create the actual bars
    barGroups
      .append("rect")
      .data(chartData)
      .attr("class", "bar")
      .attr("x", item => xScale(item.key))
      .attr("y", item => yScale((item.value / total) * 100))
      .attr("height", item => height - yScale((item.value / total) * 100))
      .attr("width", xScale.bandwidth());

    // Create the bar labels
    barGroups
      .append("text")
      .attr("class", "value")
      .attr("text-anchor", "middle");
  }

  createAxes() {
    const { svg, chart, xScale, yScale, height, width, margin } = this;

    // Y Axis
    chart
      .append("g")
      .attr("class", "yAxis")
      .call(d3.axisLeft(yScale));

    // X Axis
    chart
      .append("g")
      .attr("class", "xAxis")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-65)");

    // Grid lines
    chart
      .append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft()
          .scale(yScale)
          .tickSize(-width, 0, 0)
          .tickFormat("")
      );

    // Label on Y Axis
    svg
      .append("text")
      .attr("class", "label")
      .attr("x", -(height / 2) - margin)
      .attr("y", margin / 2.4)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("Responses (%)");
  }
}

export default BarChart;
