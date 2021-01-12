import React from 'react';
import PropTypes from 'prop-types';
import { CircularProgressbarWithChildren } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const Progress = ({ percentage,message }) => {
  return (
    <CircularProgressbarWithChildren
      className="myProgress"
      value={percentage}
      background={true}
      styles={{
        // Customize the path, i.e. the "completed progress"
        path: {
          // Path color
          stroke: `#ff9ff3`,
          // Whether to use rounded or flat corners on the ends - can use 'butt' or 'round'
          strokeLinecap: 'rounded',
          // Customize transition animation
          transition: 'stroke-dashoffset 0.5s ease 0s',
        },
        // Customize the circle behind the path, i.e. the "total progress"
        trail: {
          // Trail color
          stroke: '#c8d6e5',
          // Whether to use rounded or flat corners on the ends - can use 'butt' or 'round'
          strokeLinecap: 'rounded',
        },
        // Customize the text
        text: {
          // Text color
          fill: '#fefefe',
          // Text size
          fontSize: '8px',
        },
        // Customize background - only used when the `background` prop is true
        background: {
          fill: '#222f3e',
        },
      }}
    >
    <strong href="https://github.com/nickgarver" style={{ fontSize: 40, color: '#fefefe' }} >{percentage}%</strong>
    <a href="https://github.com/nickgarver" style={{ fontSize: 15, color: '#fefefe' }}>{message}</a>
    </CircularProgressbarWithChildren>
  );
};

Progress.propTypes = {
  percentage: PropTypes.number.isRequired,
  message: PropTypes.string.isRequired,
};

export default Progress;
