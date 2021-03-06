import * as d3 from "d3";
import * as wNumb from "wnumb";
import d3Tip from "d3-tip";
import { legendColor } from "d3-svg-legend";

class WorldMap {
  constructor() {
    this.svg = d3.select("#worldMap");
    this.margin = 40;
    this.legend = this.svg
      .append("g")
      .attr("transform", `translate(${this.margin / 4}, ${this.margin / 2})`);
    this.height = this.svg.node().getBoundingClientRect().height - this.margin * 8;
    this.width = this.svg.node().getBoundingClientRect().width - this.margin * 2;
  }

  async initialize(data) {
    // Create a world atlas projection
    const world = await d3.json("https://unpkg.com/world-atlas@1/world/110m.json");
    const projection = d3
      .geoMercator()
      .scale(this.width / 2.5 / Math.PI)
      .translate([this.width / 2, this.height / 2 + this.margin]);
    this.path = d3.geoPath().projection(projection);
    this.countries = topojson.feature(world, world.objects.countries).features;
    this.countryNames = _.chain(await d3.csv("data/world-country-names.csv"))
      .keyBy("id")
      .mapValues("name")
      .value();
    const chartData = this.generateChartData();

    // Draw the Map based on the path created from the world atlas projection
    this.map = this.svg
      .append("g")
      .attr("transform", `translate(${this.margin * 2}, ${this.margin * 4})`);
    this.map
      .selectAll("path")
      .data(chartData)
      .enter()
      .append("path")
      .attr("stroke", "white")
      .attr("fill", "white")
      .attr("stroke-linejoin", "round")
      .style("opacity", 0.8)
      .attr("d", this.path);
    this.render(data, 0);
  }

  generateChartData() {
    const { countries, countryNames } = this;
    // Match the ID of a country with its name
    return _.reduce(
      countries,
      (result, country) => {
        if (country.id in countryNames) {
          result.push(
            _.assign(country, {
              name: countryNames[country.id],
            })
          );
        }
        return result;
      },
      []
    );
  }
  countryNameConversion(name) {
    const countryNameLookup = {
      "Bolivia (Plurinational State of)": "Bolivia",
      "Congo (Democratic Republic of the)": "Congo, Republic of the...",
      "Korea (Democratic People's Republic of)": "Democratic People's Republic of Korea",
      "Congo (Democratic Republic of the)": "Democratic Republic of the Congo",
      "Iran (Islamic Republic of)": "Iran",
      Libya: "Libyan Arab Jamahiriya",
      Mauritania: "Mauritius",
      "Korea (Republic of)": "Republic of Korea",
      "Moldova (Republic of)": "Republic of Moldova",
      "Taiwan, Province of China": "Taiwan",
      "Macedonia (the former Yugoslav Republic of)": "The former Yugoslav Republic of Macedonia",
      "United Kingdom of Great Britain and Northern Ireland": "United Kingdom",
      "Tanzania, United Republic of": "United Republic of Tanzania",
      "United States of America": "United States",
      "Venezuela (Bolivarian Republic of)": "Venezuela, Bolivarian Republic of...",
    };
    return _.get(countryNameLookup, name, name);
  }

  tooltipDirection(x, y, width) {
    const upper = y < 50;
    const left = x < 300;
    const right = x > width - 400;

    if (upper && left) {
      return "se";
    } else if (upper && right) {
      return "sw";
    } else if (upper) {
      return "s";
    } else if (right) {
      return "w";
    } else if (left) {
      return "e";
    } else {
      return "n";
    }
  }

  createTooltip() {
    return d3Tip()
      .attr("class", "d3-tip")
      .offset([-10, 0])
      .html(
        d => `
            <h6>${d.name}</h6>
            <p><strong>Responses:</strong> ${wNumb({
              thousand: ",",
            }).to(d.responses)}<br>
            <strong>Median Compensation:</strong> ${wNumb({
              prefix: "$",
              thousand: ",",
            }).to(d.medianCompensation)}<br>
            <strong>Average Years of Professional Coding:</strong> ${wNumb({
              decimals: 2,
            }).to(d.avgYearsCodePro)}</p>
          `
      );
  }

  createLegend(scale) {
    this.legend.call(
      legendColor()
        .scale(scale)
        .cells(10)
        .shape("circle")
        .shapePadding(15)
        .title("Median Compensation ($):")
        .labelOffset(20)
        .labelFormat(d3.format(",.0f"))
        .orient("vertical")
    );
  }

  filterByMinimum(chartData, minimum) {
    return _.map(chartData, d =>
      d.responses > minimum
        ? d
        : {
            avgYearsCodePro: d.avgYearsCodePro,
            geometry: d.geometry,
            id: d.id,
            medianCompensation: d.medianCompensation,
            name: d.name,
            properties: d.properties,
            responses: 0,
            type: d.type,
          }
    );
  }

  render(data, minimum) {
    const { countries, countryNames, countryNameConversion, tooltipDirection } = this;
    const groupedCountries = _.groupBy(data, d => d.Country);
    const countryData = d3
      .nest()
      .key(country => country)
      .rollup(country => ({
        responses: groupedCountries[country].length,
        medianCompensation: d3.median(groupedCountries[country], e =>
          e["ConvertedComp"] != "NA" ? +e["ConvertedComp"] : null
        ),
        avgYearsCodePro: d3.mean(groupedCountries[country], e =>
          e["YearsCodePro"] != "NA" ? +e["YearsCodePro"] : null
        ),
      }))
      .entries(d3.keys(groupedCountries));

    const colorScale = d3
      .scaleSequential(d3.interpolateReds)
      .domain([
        _.min(_.map(countryData, c => c.value.medianCompensation)),
        _.mean(_.map(countryData, c => c.value.medianCompensation)) * 2,
      ]);

    const chartData = _.reduce(
      countries,
      (result, country) => {
        if (country.id in countryNames) {
          result.push(
            _.assign(country, {
              name: countryNames[country.id],
              medianCompensation: _.get(
                _.find(
                  countryData,
                  d => d.key === countryNameConversion(countryNames[country.id])
                ) || {},
                "value.medianCompensation",
                0
              ),
              responses: _.get(
                _.find(
                  countryData,
                  d => d.key === countryNameConversion(countryNames[country.id])
                ) || {},
                "value.responses",
                0
              ),
              avgYearsCodePro: _.get(
                _.find(
                  countryData,
                  d => d.key === countryNameConversion(countryNames[country.id])
                ) || {},
                "value.avgYearsCodePro",
                0
              ),
            })
          );
        }
        return result;
      },
      []
    );

    // Create Legend
    this.createLegend(colorScale);

    // Create tooltip
    const tip = this.createTooltip();
    this.map.call(tip);

    this.map
      .selectAll("path")
      .data(this.filterByMinimum(chartData, minimum))
      .attr("fill", d => colorScale(d.responses > 0 ? d.medianCompensation : 0))
      .on("mouseover", function(d, i) {
        // Highlight country boundaries
        d3.select(this)
          .style("opacity", 1)
          .style("stroke", "white")
          .style("stroke-width", 3);
        // Show tooltip
        tip
          .direction(
            tooltipDirection(
              this.getBBox().x,
              this.getBBox().y,
              document.querySelector("#worldMap g").getBBox().width
            )
          )
          .show(d, this);
      })
      .on("mouseout", function(d, i) {
        // Hide tooltip
        tip.hide(d);
        // Reset country boundaries
        d3.select(this)
          .style("opacity", 0.8)
          .style("stroke", "white")
          .style("stroke-width", 0.3);
      });
  }
}

export default WorldMap;
