import React, { useRef, useEffect, useState } from "react";
import { select, axisBottom, axisRight, scaleLinear, scaleBand } from "d3";
import ResizeObserver from "resize-observer-polyfill";

const useResizeObserver = ref => {
  const [dimensions, setDimensions] = useState(null);
  useEffect(() => {
    const observeTarget = ref.current;
    const resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => {
        setDimensions(entry.contentRect);
      });
    });
    resizeObserver.observe(observeTarget);
    return () => {
      resizeObserver.unobserve(observeTarget);
    };
  }, [ref]);
  return dimensions;
};

function BillingGroupBarChart({ data }) {
  const svgRef = useRef();
  const wrapperRef = useRef();
  const dimensions = useResizeObserver(wrapperRef);

  // will be called initially and on every data change
  useEffect(() => {
    const svg = select(svgRef.current);
    // console.log(dimensions);

    if (!dimensions) return;

    // scales
    const xScale = scaleBand()
      .domain(data.map((value, index) => index))
      .range([0, dimensions.width]) 
      .padding(0.5);

    const yScale = scaleLinear()
      .domain([0, (Math.max.apply(Math, data.map(function(o) { return o.total; }))) + 50]) // todo
      .range([dimensions.height, 0]);

    const colorScale = scaleLinear()
      .domain([100, 200, 350])
      .range(["red", "orange", "green"])
      .clamp(true);

    // create x-axis
    const xAxis = axisBottom(xScale).ticks(data.length).tickFormat(function(d,i){ return data[i].yearMonth });
    svg
      .select(".x-axis")
      .style("transform", `translateY(${dimensions.height}px)`)
      .call(xAxis);

    // create y-axis
    const yAxis = axisRight(yScale);
    svg
      .select(".y-axis")
      .style("transform", `translateX(${dimensions.width}px)`)
      .call(yAxis);

    // draw the bars
    svg
      .selectAll(".bar")
      .data(data.map(value => value.total))
      .join("rect")
      .attr("class", "bar")
      .style("transform", "scale(1, -1)")
      .attr("x", (value, index) => xScale(index))
      .attr("y", -dimensions.height)
      .attr("width", xScale.bandwidth())
      .on("mouseenter", (value, index) => {
        svg
          .selectAll(".tooltip")
          .data([value])
          .join(enter => enter.append("text").attr("y", yScale(value) - 4))
          .attr("class", "tooltip")
          .text(`$ ${value.toFixed(2)}`)
          .attr("x", xScale(index) + xScale.bandwidth() / 2)
          .attr("text-anchor", "middle")
          .transition()
          .attr("y", yScale(value) - 8)
          .attr("opacity", 1);
      })
      .on("mouseleave", () => svg.select(".tooltip").remove())
      .transition()
      .attr("fill", colorScale)
      .attr("height", value => dimensions.height - yScale(value));
  }, [data, dimensions]);
  
  return (
    <div ref={wrapperRef} style={{ marginBottom: "2rem" }}>
      <svg className="barChart" ref={svgRef}>
        <g className="x-axis" />
        <g className="y-axis" />
      </svg>
      <style jsx>{`
        .barChart {
          background: #eee;
          width: 100%;
          display: block;
          overflow: visible;
        }
      `}</style>
    </div>
  );

  return (<div>Hey</div>)
}

export default BillingGroupBarChart;
