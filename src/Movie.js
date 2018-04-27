import React from 'react'
import { UnControlled as ReactCodeMirror } from 'react-codemirror2'
import CodeMirror from 'codemirror/lib/codemirror'
import Tooltip from './Tooltip'

const STATUS_IDLE = 'idle'
const STATUS_PLAY = 'play'
const STATUS_PAUSE = 'pause'

const requestTimer = (fn, delay) => {
  if (!delay) {
    fn()
  } else {
    return setTimeout(fn, delay)
  }
}

class Movie extends React.Component {
  editor = null

  state = {
    status: STATUS_IDLE,
    queue: [],
    index: 0
  }

  updateState = data => new Promise(resolve => this.setState(data, resolve))

  componentDidMount () {
    this.initMovie()
  }

  componentDidUpdate (prevProps) {
    if (this.props.playing) {
      if (!prevProps.playing) {
        this.play()
      }
    } else {
      if (prevProps.playing) {
        this.pause()
      }
    }
  }

  initMovie = () => {
    if (!('preventCursorMovement' in CodeMirror.defaults)) {
      CodeMirror.defineOption('preventCursorMovement', false, cm => {
        var handler = (cm, event) => cm.getOption('readOnly') && event.preventDefault()
        cm.on('keydown', handler)
        cm.on('mousedown', handler)
      })
    }
  }

  toggle = () => {
    if (this.state.status === STATUS_PLAY) {
      this.pause()
    } else {
      this.play()
    }
  }

  runQueue = async () => {
    const timerObj = this.state.queue[0]
    if (!timerObj) {
      return
    }

    const { fn, delay } = timerObj
    requestTimer(fn, delay)

    await this.updateState({
      queue: this.state.queue.slice(1)
    })

    await this.runQueue()
  }

  play = async () => {
    if (this.state.status === STATUS_PLAY) {
      // already playing
      return
    }

    if (this.state.status === STATUS_PAUSE) {
      // revert from paused state
      this.editor.focus()

      await this.updateState({
        status: STATUS_PLAY
      })

      await this.runQueue()
      return
    }

    if (!this.props.commands.length) {
      this.finish()
      return
    }

    this.editor.execCommand('revert')
    this.editor.setOption('readOnly', true)
    this.editor.focus()

    await this.updateState({
      status: STATUS_PLAY
    })
  }

  pause = () => {
    if (this.state.status === STATUS_PLAY) {
      this.setState({
        status: STATUS_PAUSE
      })
    }
  }

  finish = async () => {
    await this.resetState()
    if (this.props.onFinish) {
      await this.props.onFinish()
    }
  }

  stop = async () => {
    await this.resetState()
    if (this.props.onStop) {
      await this.props.onStop()
    }
  }

  resetState = () => {
    this.editor.setOption('readOnly', false)

    return new Promise(resolve => {
      this.setState({
        status: STATUS_IDLE,
        queue: [],
        index: 0
      }, resolve)
    })
  }

  requestTimer = (fn, delay) => {
    if (this.state.status !== STATUS_PLAY) {
      // save function call into a queue till next 'play()' call
      this.setState({
        queue: [...this.state.queue, { fn, delay }]
      })
    } else {
      return requestTimer(fn, delay)
    }
  }

  render () {
    const { className, code } = this.props

    const defaultOptions = {
      mode: 'text/x-java',
      theme: 'seti',
      lineNumbers: true,
      lineWrapping: true,
      readOnly: false,
      autoRefresh: true,
      showCursorWhenSelecting: false
    }

    const options = { ...defaultOptions, ...this.props.options }

    return (
      <div className={className}>
        {this.state.status !== STATUS_IDLE &&
          this.renderAction()
        }

        <ReactCodeMirror
          editorDidMount={editor => { this.editor = editor }}
          value={code}
          options={options}
        />
      </div>
    )
  }

  handleActionChange = index => {
    this.setState({
      index
    })
  }

  renderAction = () => {
    const { index } = this.state
    const { commands } = this.props
    if (commands.length === 0) {
      return null
    }

    const command = commands[index]
    if (!command) {
      return null
    }

    if (command.type !== 'tooltip') {
      return null
    }

    return (
      <Tooltip
        options={command.options}
        editor={this.editor}
        index={index}
        total={commands.length}
        onActionChange={this.handleActionChange}
        onStop={this.stop}
        onFinish={this.finish}
        timer={this.requestTimer}
        customClasses={this.props.tooltipClasses}
      />
    )
  }
}

export default Movie
