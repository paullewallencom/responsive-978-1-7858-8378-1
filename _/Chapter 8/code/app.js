function sum(a, b) {
  return a + b;
}

function countValuesOfNest(nest) {
  return nest.map(function(d){
    return d.values.length;
  }).reduce(sum, 0);
}

function adaptResolutionOfNest(nest, resolution) {
  return nest.map(function(d){
    return {
      key: d.key,
      values: adaptResolution(d.values, resolution)
    }
  });
}

function adaptResolution(data, resolution) {
  resolution = resolution !== undefined ? Math.max(1, Math.ceil(resolution)) : 1;
  return data.filter(function(d, i) {
    return i % resolution === 0;
  });
}

function sortByAttr(attr) {
  return function(a, b) {
    return a[attr] > b[attr];
  }
}

function getAttributes(elem){
  var atts = {};
  d3.values(elem.attributes).forEach(function(attr){
    atts[attr.nodeName] = attr.nodeValue;
  });
  return atts;
}

function flattenNest(nest){
  return flatten(nest.map(function(d){
    return d.values;
  }));
}

function flatten(arr) {
  return arr.reduce(function(prev, d, i){
    return prev.concat(d);
  }, []);
}

function unique(arr) {
  return arr.filter(function(value, index, self) {
    return self.indexOf(value) === index;
  });
}

function choropleth(selector) {
  // Select all charts
  var $charts = d3.selectAll(selector);
  var aspectRatio = 16.0 / 9.0;

  flatten($charts).forEach(function(chart, i){
    var atts = getAttributes(chart);
    var mapUrl = atts['data-map-url'];
    var dataUrl = atts['data-url'];
    var startColor = atts['data-color-start'];
    var endColor = atts['data-color-end'];
    var $svg = d3.select(chart).append('svg');
    var width = chart.clientWidth;
    var height = width / aspectRatio;
    var padding = 10;

    var color = d3.scale.linear()
        .domain([0, .15])
        .interpolate(d3.interpolateRgb)
        .range([startColor, endColor]);

    var projection = d3.geo.albersUsa()
        .scale(width)
        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);

    var svg = $svg
        .attr("width", width)
        .attr("height", height);

    queue()
        .defer(d3.json, mapUrl)
        .defer(d3.csv, dataUrl)
        .await(ready);

    function ready(error, us, unemployment) {
      if (error) throw error;

      var data = {};

      unemployment.forEach(function(d){
        data[d.id] = +d.rate;
      });

      $svg.append("g")
          .attr("class", "counties")
        .selectAll("path")
          .data(topojson.feature(us, us.objects.counties).features)
        .enter().append("path")
          .attr("d", path)
          .attr("fill", "#FFFFFF")
          .transition()
          .duration(1000)
          .attr("fill", function(d) { return color(data[d.id]); });

      $svg.append("path")
          .datum(topojson.mesh(us, us.objects.states))
          .attr("class", "states")
          .attr("d", path);
    }
  });
}

function barchart(selector) {
  // Select all charts
  var $charts = d3.selectAll(selector);
  var aspectRatio = 4.0 / 3.0;

  flatten($charts).forEach(function(chart, i){
    var atts = getAttributes(chart);
    var url = atts['data-url'];
    var colors = d3.scale.category10();
    var $svg = d3.select(chart).append('svg');
    var $axesGroup = $svg.append('g').attr('class', 'axis-container');
    var $dataGroup = $svg.append('g').attr('class', 'data-container');
    var xKey = function(d){ return d.x; };
    var yKey = function(d){ return d.y; };
    var groupKey = function(d){ return d.group; };
    var nest = d3.nest().key(groupKey);
    var padding = 30;

    d3.csv(url, function(results){

      // Clean the data
      var flatData = results.map(function(d){
        d.x = d[atts['data-x']];
        d.y = parseFloat(d[atts['data-y']]);
        d.group = d[atts['data-groupby']];
        return d;
      });

      if (atts['data-x-filter']) {
       flatData = flatData.filter(function(d){
          return d.x.search(atts['data-x-filter']) >= 0;
        });
      }

      // Transform flat data to hierarchical data
      var nestData = nest.entries(flatData);

      // Redraw the chart
      redraw();

      window.addEventListener('resize', function(event){
        redraw();
      });

      function redraw() {
        var width = chart.clientWidth;
        var height = width / aspectRatio;
        var pixelsPerData = 20;
        var resolution = pixelsPerData * (flatData.length) / width;
        var nestDataRes = adaptResolutionOfNest(nestData, resolution);
        var flatDataRes = flattenNest(nestDataRes);
        var numDataPoints = countValuesOfNest(nestDataRes);
        var barWidth = 0.9 * (width - 2*padding) / numDataPoints;

        // Set a fixed height
        $svg.attr('height', height);

        var xScale = d3.scale.ordinal()
          .domain(flatDataRes.map(xKey))
          .rangeBands([padding, width - 2*padding]);

        var yScale = d3.scale.linear()
          .domain([0, d3.max(flatDataRes, yKey)])
          .range([height - 2*padding, padding]);

        var xAxis = d3.svg.axis()
          .scale(xScale)
          .tickFormat(function(s){
            return s.replace(/[0-9]*/gi, '');
          })
          .ticks(numDataPoints / nestDataRes.length);

        var yAxis = d3.svg.axis()
          .scale(yScale)
          .orient('left');

        var $$xAxis = $axesGroup.selectAll('.x.axis')
          .data([true]);

        $$xAxis.enter().append('g')
          .attr('class', 'x axis');

        $$xAxis.attr('transform', 'translate(0, ' + (height - 2*padding) + ')')
          .call(xAxis);

        var $$yAxis = $axesGroup.selectAll('.y.axis')
          .data([true]);

        $$yAxis.enter().append('g')
          .attr('class', 'y axis');

        $$yAxis.attr('transform', 'translate(' + padding + ')')
          .call(yAxis);

        nestDataRes.forEach(function(data, i){
          var $$bars = $dataGroup.selectAll('rect.g-' + i)
            .data(data.values, xKey);

          $$bars.enter()
            .append('rect')
            .attr('class', 'g-' + i);

          $$bars
            .attr('x', function(d) { return xScale(d.x) + i*barWidth; })
            .attr('y', function(d) { return yScale(0); })
            .attr('height', 0)
            .attr('width', barWidth)
            .attr('fill', colors(data.key));

          $$bars
            .transition()
            .attr('y', function(d) { return yScale(d.y); })
            .attr('height', function(d) { return (yScale(0) - yScale(d.y)); });

          $$bars.exit()
            .remove();
        });
      }
    });
  });
}