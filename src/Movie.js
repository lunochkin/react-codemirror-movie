import React from 'react'
import {UnControlled as ReactCodeMirror} from 'react-codemirror2'
import CodeMirror from 'codemirror/lib/codemirror'
import parse from './parse'

import Tooltip from './Tooltip'


const STATUS_IDLE  = 'idle'
const STATUS_PLAY  = 'play'
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
    actions: [],
    index: 0
  }

  updateState = data => new Promise(resolve => this.setState(data, resolve))

  componentDidMount() {
    this.initMovie()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.code !== this.props.code || prevProps.commands !== this.props.commands) {
      this.initMovie()
      return
    }

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
  
    const editor = this.editor

    const initialValue = editor.getValue() || ''

    let {value, actions} = parse(initialValue)

    // normalize line endings
    value = value.replace(/\r?\n/g, '\n')

    const initialPos = value.indexOf('|')

    value = value.replace(/\|/g, '')
    editor.setValue(value)

    if (initialPos !== -1) {
      editor.setCursor(editor.posFromIndex(initialPos))
    }

    this.setState({
      actions
    })
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

    const {fn, delay} = timerObj
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
    
    if (!this.state.actions.length) {
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
    await this.props.onFinish()
  }
	
	stop = async () => {
    await this.resetState()
    await this.props.onStop()
  }
  
  resetState = () => {
    this.editor.setOption('readOnly', false)

    return new Promise(r => {
      this.setState({
        status: STATUS_IDLE,
        queue: [],
        index: 0
      }, r)
    })
  }
	
	requestTimer = (fn, delay) => {
		if (this.state.status !== STATUS_PLAY) {
      // save function call into a queue till next 'play()' call
      this.setState({
        queue: [...this.state.queue, {fn, delay}]
      })
		} else {
			return requestTimer(fn, delay)
		}
	}

  render() {
    const {className, code, commands} = this.props

    let script = code
    if (commands && commands.length) {

      const cmdsString = commands.map(one =>
        `${one.type}: ${JSON.stringify(one.options)}`
      ).join('\n')

      script += `\n@@@\n${cmdsString}\n`
    }

    const defaultOptions = {
      mode: 'text/x-java',
      theme: 'seti',
      lineNumbers: true,
      lineWrapping: true,
      readOnly: false,
      autoRefresh: true,
      showCursorWhenSelecting: false
    }

    const options = {...defaultOptions, ...this.props.options}

    return (
      <div className={className}>
        {this.state.status !== STATUS_IDLE &&
          this.renderAction()
        }

        <ReactCodeMirror
          editorDidMount={editor => {this.editor = editor}}
          value={script}
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
    const {actions, index} = this.state
    if (actions.length === 0) {
      return null
    }

    const action = actions[index]
    if (!action) {
      return null
    }

		if (action.name !== 'tooltip') {
      return null
    }

    return (
      <Tooltip
        options={action.options}
        editor={this.editor}
        index={index}
        total={actions.length}
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
