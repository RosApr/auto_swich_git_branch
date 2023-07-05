const rdl = require('readline')

const stdout = process.stdout
const stdin = process.stdin

class SelectVersion {
  constructor(
    options
  ) {
    this.question = '可用版本:'
    this.options = options
    this.pointer = '>'
    this._color = 'magenta'
    this.cursorY = 0
    this.currentSelect = this.options[this.cursorY]
    this.stack = []
    return this
  }
  highlightOutput(str, colorName = 'yellow') {
    const colors = {
      yellow: [33, 89],
      blue: [34, 89],
      green: [32, 89],
      cyan: [35, 89],
      red: [31, 89],
      magenta: [36, 89],
    }
    const _color = colors[colorName]
    const start = '\x1b[' + _color[0] + 'm'
    const stop = '\x1b[' + _color[1] + 'm\x1b[0m'
    return start + str + stop
  }
  handleUserAction(self) {
    return c => {
      switch (c) {
        case '\u0004': // Ctrl-d
        case '\r':
        case '\n':
          return self.handleEnterClick()
        case '\u0003': // Ctrl-c
          return self.handleExit()
        case '\u001b[A':
          return self.handleUpArrowClick()
        case '\u001b[B':
          return self.handleDownArrowClick()
      }
    }
  }
  handleUpArrowClick() {
    rdl.cursorTo(stdout, 0, this.cursorY)
    stdout.write(this.formatOutputOption(this.cursorY - 1))
    if (this.cursorY === 1) {
      this.cursorY = this.options.length
    } else {
      this.cursorY--
    }
    this.cursorY = this.cursorY
    rdl.cursorTo(stdout, 0, this.cursorY)
    stdout.write(
      this.highlightOutput(
        this.formatOutputOption(this.cursorY - 1),
        this._color
      )
    )
    this.currentSelect = this.options[this.cursorY - 1]
  }
  handleDownArrowClick() {
    rdl.cursorTo(stdout, 0, this.cursorY)
    stdout.write(this.formatOutputOption(this.cursorY - 1))
    if (this.cursorY === this.options.length) {
      this.cursorY = 1
    } else {
      this.cursorY++
    }
    this.cursorY = this.cursorY
    rdl.cursorTo(stdout, 0, this.cursorY)
    stdout.write(
      this.highlightOutput(
        this.formatOutputOption(this.cursorY - 1),
        this._color
      )
    )
    this.currentSelect = this.options[this.cursorY - 1]
  }
  handleExit() {
    stdin.removeListener('data', this.handleUserAction)
    stdin.setRawMode(false)
    stdin.pause()
    this.showCursor()
  }
  handleEnterClick() {
    this.handleExit()
    rdl.cursorTo(stdout, 0, this.options.length + 1)
    stdout.write('\nYou selected: ' + this.currentSelect + '\n')
    this.stack.forEach(cb => cb.call(null, this.currentSelect))
  }
  showCursor() {
    stdout.write('\x1B[?25h')
  }
  hideCursor() {
    stdout.write('\x1B[?25l')
  }
  formatOutputOption(index) {
    return this.pointer + ' ' + this.options[index] + '\n'
  }
  start() {
    stdout.write(this.question + '\n')
    for (let index = 0; index < this.options.length; index++) {
      const optStr = this.formatOutputOption(index)
      if (index === 0) {
        this.currentSelect = this.options[index]
        stdout.write(this.highlightOutput(optStr, this._color))
      } else {
        stdout.write(optStr)
      }
      this.cursorY = index + 1
    }
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf-8')
    this.hideCursor()
    stdin.on('data', this.handleUserAction(this))
    return this
  }
  onSelect(callback) {
    this.stack.push(callback)
  }
}

module.exports = {
    SelectVersion
}
