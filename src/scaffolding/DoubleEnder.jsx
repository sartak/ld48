import React from 'react';
import './DoubleEnder.css';

const semiFloor = (n) => {
  return Math.floor(2 * n) / 2;
};

const semiCeil = (n) => {
  return Math.ceil(2 * n) / 2;
};

export default class DoubleEnder extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dragging: null,
      lastDrag: null,
    };

    this.trackRef = React.createRef();
  }

  componentDidMount() {
    // force track ref to have getBoundingClientRect
    // eslint-disable-next-line react/no-unused-state
    this.setState({refreshDimensions: true});

    window.addEventListener('resize', this.didResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.didResize);
  }

  didResize = () => {
    this.forceUpdate();
  };

  render() {
    const {
      min, max, value1, value2, onChange1, onChange2,
      onMouseUp, onMouseEnter, onMouseMove, onMouseLeave,
      onBeginChange, onEndChange, notches, highlight1, highlight2,
    } = this.props;
    const {dragging, lastDrag} = this.state;
    const sliderWidth = 16;

    const trackDimensions = this.trackRef.current && this.trackRef.current.getBoundingClientRect();
    const trackLeft = trackDimensions ? trackDimensions.left : 0;
    const trackWidth = trackDimensions ? trackDimensions.width : 100;
    const percent1 = Math.max(0, Math.min(1, (value1 - min) / (max - min)));
    const percent2 = Math.max(0, Math.min(1, (value2 - min) / (max - min)));
    const highlightPercent1 = Math.max(0, Math.min(1, (highlight1 - min) / (max - min)));
    const highlightPercent2 = Math.max(0, Math.min(1, (highlight2 - min) / (max - min)));

    return (
      <div className="DoubleEnder" onMouseUp={onMouseUp} onMouseEnter={onMouseEnter} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
        <div className="track" ref={this.trackRef} />
        <div
          style={{
            left: `${semiFloor(percent1 * trackWidth)}px`,
            right: `${semiCeil(trackWidth - percent2 * trackWidth)}px`,
          }}
          className="track selected"
        />
        <div
          style={{
            left: `${semiFloor(highlightPercent1 * trackWidth)}px`,
            right: `${semiCeil(trackWidth - highlightPercent2 * trackWidth)}px`,
          }}
          className="track highlighted"
        />
        {notches.map(({value, title}) => {
          const isSelected = (value >= value1 && value <= value2) || (value >= value2 && value <= value1);
          const isHighlighted = (value >= highlight1 && value <= highlight2) || (value >= highlight2 && value <= highlight1);
          const percent = Math.max(0, Math.min(1, (value - min) / (max - min)));
          const classes = ['notch'];
          if (isHighlighted) {
            classes.push('highlighted');
          } else if (isSelected) {
            classes.push('selected');
          }

          return (
            <div
              key={value}
              title={title}
              className={classes.join(' ')}
              style={{
                left: `${semiFloor(percent * trackWidth)}px`,
              }}
            >
              {' '}
            </div>
          );
        })}
        {[1, 2].map((index) => {
          let i = index;
          const value = i === 1 ? value1 : value2;
          let opposite = i === 1 ? 2 : 1;
          const oppositeValue = opposite === 1 ? value1 : value2;
          const percent = Math.max(0, Math.min(1, (value - min) / (max - min)));

          return (
            <div
              key={i}
              style={{
                left: `${semiFloor(percent * (trackWidth - sliderWidth))}px`,
                zIndex: i === lastDrag ? 5 : 4,
              }}
              className={`slider slider${i} ${dragging === i ? 'dragging' : ''}`}
              onMouseDown={(e) => {
                const originalX = e.clientX - e.target.getBoundingClientRect().left;

                if (onBeginChange) {
                  onBeginChange();
                }
                let onChange = i === 1 ? onChange1 : onChange2;

                this._dragListener = ({clientX}) => {
                  const newPercent = (clientX - trackLeft - originalX) / (trackWidth - sliderWidth);
                  const rawValue = min + newPercent * (max - min);
                  const newValue = Math.min(max, Math.max(min, rawValue));

                  if ((i === 1 && newValue > oppositeValue) || (i === 2 && newValue < oppositeValue)) {
                    if (onChange) {
                      onChange(oppositeValue);
                    }

                    i = opposite;
                    opposite = i === 1 ? 2 : 1;
                    onChange = i === 1 ? onChange1 : onChange2;
                    this.setState({dragging: i, lastDrag: i});
                  } else if (onChange) {
                    onChange(newValue);
                  }
                };

                this._upListener = (e) => {
                  this._dragListener(e);

                  window.removeEventListener('mousemove', this._dragListener);
                  delete this._dragListener;

                  window.removeEventListener('mouseup', this._upListener);
                  delete this._upListener;

                  this.setState({dragging: null});

                  if (onEndChange) {
                    onEndChange();
                  }
                };

                window.addEventListener('mousemove', this._dragListener);
                window.addEventListener('mouseup', this._upListener);

                this.setState({dragging: i, lastDrag: i});
              }}
            />
          );
        })}
      </div>
    );
  }
}
