import React from 'react'
import jss from 'react-jss'
import {Motion, spring} from 'react-motion'
import cx from 'classnames'

import ArrowRight from './imgs/icon-tooltip-arrow-right.svg'
import ArrowLeft from './imgs/icon-tooltip-arrow-left.svg'
import IconActiveOval from './imgs/icon-active-oval.svg'
import IconInactiveCircle from './imgs/icon-inactive-circle.svg'
import IconClose from './imgs/icon-close.svg'



const decorate = jss({
  root: {
    background: 'lightgrey',
    position: 'fixed',
    width: 400,
    zIndex: 100,
    top: 0,
    left: 0
  },
  corner: {
    transform: 'rotate(135deg)',
    width: 10,
    height: 10,
    position: 'absolute',
    bottom: -4,
    right: 'calc(50% - 5px)',
    background: 'lightgrey'
  },
  content: {
    color: 'black',
    fontSize: 12,
    padding: [[15, 30, 15, 30]],
    borderBottom: '1px solid rgba(200, 200, 200, 0.1)',
    whiteSpace: 'pre-wrap'
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: [[10, 20, 10, 20]],
    alignItems: 'center'
  },
  pagination: {
    minHeight: 1,
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
  },
  paginationItem: {
    padding: [[0, 2]],
    cursor: 'pointer',
    boxSizing: 'content-box'
  },
  paginationItemActive: {
    cursor: 'default'
  },
  prev: {
    cursor: 'pointer',
    padding: 5,
    height: 10,
    marginTop: -5,
    boxSizing: 'content-box'
  },
  next: {
    cursor: 'pointer',
    padding: 5,
    height: 10,
    marginTop: -5,
    boxSizing: 'content-box'
  },
  finish: {
    color: 'black',
    cursor: 'pointer',
    fontSize: 14,
    '&:hover': {
      color: 'rgba(255, 255, 255, 1)'
    }
  },
  iconClose: {
    position: 'absolute',
    padding: 5,
    top: 10,
    right: 10,
    cursor: 'pointer',
    boxSizing: 'content-box'
  },
  stepsInfo: {
    fontSize: 14,
    marginTop: 20,
    marginLeft: 30
  },
  invisible: {
    visibility: 'hidden'
  }
})

const getPos = ({editor, tooltip, options}) => {
  const [line, ch] = options.pos.split(':').map(one => parseInt(one, 10))

  const coords = editor.charCoords({line, ch})

  const viewportLeft = window.pageXOffset - document.documentElement.clientLeft
  const viewportWidth = document.documentElement.clientWidth

  const width = 400
    
  const left = Math.min(viewportWidth - width, Math.max(0, coords.left - viewportLeft - width / 2))
  const top = Math.max(0, coords.top - tooltip.scrollHeight)

  return {left, top}
}

class Tooltip extends React.Component {

  ref = React.createRef()

  state = {
    stopping: false,
    finishing: false,
    appearing: true,
    fromPos: {
      left: 0,
      top: 0
    },
    pos: {
      left: 0,
      top: 0
    },
  }

  componentDidMount() {
    this.updatePos()
  }

  componentDidUpdate() {
    this.updatePos()
  }

  updatePos = () => {
    if (!this.ref.current) {
      return
    }

    const {pos} = this.state

    const nextPos = getPos({
      editor: this.props.editor,
      tooltip: this.ref.current,
      options: this.props.options
    })

    if (pos.left === nextPos.left && pos.top === nextPos.top) {
      return
    }

    this.setState({
      stopping: false,
      finishing: false,
      appearing: true,
      fromPos: pos,
      pos: nextPos
    })
  }

  handleStop = () => {
    this.setState({
      stopping: true
    })
  }

  handleFinish = () => {
    this.setState({
      finishing: true
    })
  }

  handleReady = () => {
    this.setState({
      appearing: false
    })
  }

  getResultClasses = () => {
    const {classes, customClasses} = this.props
    if (!customClasses) {
      return classes
    }

    const result = {}
    Object.keys(classes).forEach(key => {
      result[key] = cx(classes[key], customClasses[key])
    })

    return result
  }

  render() {
    if (this.state.stopping || this.state.finishing) {
      return this.renderDisapearance()
    }

    if (this.state.appearing) {
      return this.renderAppearance()
    }

    return this.renderTooltip(this.state.pos)
  }

  renderAppearance() {
    const {pos, fromPos} = this.state

    return (
      <Motion
        defaultStyle={{
          opacity: fromPos.left ? 1 : 0,
          left: fromPos.left,
          top: fromPos.top
        }}
        style={{
          opacity: spring(1),
          left: spring(pos.left),
          top: spring(pos.top)
        }}
        onRest={this.handleReady}
      >
        {({opacity, left, top}) =>
          this.renderTooltip({
            opacity,
            transform: `translate3d(${left}px, ${top}px, 0)`
          })
        }
      </Motion>
    )
  }

  renderDisapearance() {
    const {pos} = this.state

    return (
      <Motion defaultStyle={{opacity: 1}} style={{opacity: spring(0)}} onRest={this.state.stopping ? this.props.onStop : this.props.onFinish}>
        {({opacity}) =>
          this.renderTooltip({
            opacity,
            left: pos.left,
            top: pos.top
          })
        }
      </Motion>
    )
  }

  handleNext = () => {
    this.props.onActionChange(this.props.index + 1)
  }

  handlePrev = () => {
    this.props.onActionChange(this.props.index - 1)
  }

  renderTooltip(style) {
    const {total, index, options} = this.props
    const classes = this.getResultClasses()

    return (
      <div className={cx(classes.root, classes.defaultRoot)} style={style} ref={this.ref}>
        <div className={cx(classes.stepsInfo, total <= 1 && classes.invisible)}>{index + 1}/{total}</div>
        <div className={classes.content}>{options.text}</div>

        <IconClose className={classes.iconClose} onClick={this.handleStop} />
  
        <div className={classes.controls}>
          {index > 0 &&
            <ArrowLeft className={classes.prev} onClick={this.handlePrev} />
          }

          {this.renderPagination()}

          {index < total - 1 ?
            <ArrowRight className={classes.next} onClick={this.handleNext} />
            :
            <span className={classes.finish} onClick={this.handleFinish}>Finish</span>
          }
        </div>

        <div className={classes.corner} />
      </div>
    )
  }

  renderPagination() {
    const {index, total} = this.props
    const items = Array(total).fill(0)
    const classes = this.getResultClasses()

    return (
      <div className={cx(classes.pagination, total <= 1 && classes.invisible)}>
        {items.map((one, i) => {
          const Component = i === index ? IconActiveOval : IconInactiveCircle
          return (
            <Component
              key={i}
              onClick={i === index ? null : () => this.props.onActionChange(i)}
              className={cx(
                classes.paginationItem,
                i === index && classes.paginationItemActive
              )}
            />
          )
        })}
      </div>
    )
  }
}


export default decorate(Tooltip)
